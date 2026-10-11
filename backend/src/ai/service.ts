import type { z } from 'zod'
import { logger } from '../logger.js'
import { AiUnavailableError } from './errors.js'
import { CircuitBreaker } from './breaker.js'
import { parseModelOutput } from './normalize.js'
import { completeText, ProviderError, streamText, type ProviderMessage, type ProviderSettings } from './openrouter.js'
import { repairSystemPrompt } from './prompts.js'

// Tasks of docs/role.md section 7 and P-AI-00 to P-AI-08. Each task belongs to one model chain.
export type AiTask =
  | 'CHAT'
  | 'KUIS_GENERATE'
  | 'PEMBAHASAN'
  | 'JADWAL_SARAN'
  | 'KLASIFIKASI'
  | 'NILAI_ESAI'
  | 'REPAIR_JSON'
  | 'MODERASI'

export type ChainName = 'chat' | 'kuis' | 'ringan'

const CHAIN_OF: Record<AiTask, ChainName> = {
  CHAT: 'chat',
  KUIS_GENERATE: 'kuis',
  PEMBAHASAN: 'kuis',
  NILAI_ESAI: 'kuis',
  JADWAL_SARAN: 'ringan',
  KLASIFIKASI: 'ringan',
  REPAIR_JSON: 'ringan',
  MODERASI: 'ringan',
}

// Temperature for JSON tasks. Chat answers are a little looser.
const JSON_TEMPERATURE = 0.2
const CHAT_TEMPERATURE = 0.5

export interface AiOptions {
  mode: 'live' | 'mock'
  apiKey: string
  baseUrl: string
  chains: Record<ChainName, string[]>
  timeoutMs: number
  maxTokens: { chat: number; kuis: number }
  reasoningEffort: 'low' | 'medium' | 'high'
  fetchImpl: typeof fetch
  breaker?: CircuitBreaker
  // Pause between mock stream pieces. Tests set it to zero.
  mockDelayMs?: number
}

export interface CompleteRequest<T> {
  task: AiTask
  system: string
  user: string
  schema: z.ZodType<T>
  // Output used when mode is mock. It still goes through the schema check.
  mock: () => string
}

export interface StreamRequest {
  messages: ProviderMessage[]
  mock: string
  signal: AbortSignal
  onDelta: (text: string) => void
}

// The only place where models are called. It handles chains, swaps, repairs, and the circuit breaker.
export class AiService {
  private readonly options: AiOptions
  private readonly breaker: CircuitBreaker

  constructor(options: AiOptions) {
    this.options = options
    this.breaker = options.breaker ?? new CircuitBreaker()
  }

  get mode(): 'live' | 'mock' {
    return this.options.mode
  }

  // Returns a value that passed the schema, or throws AiUnavailableError when every model failed.
  async complete<T>(request: CompleteRequest<T>): Promise<T> {
    if (this.options.mode === 'mock') {
      const parsed = parseModelOutput(request.mock(), request.schema)
      if (!parsed.ok) {
        throw new Error(`Keluaran mock untuk ${request.task} tidak lolos skema: ${parsed.error}`)
      }
      return parsed.value
    }

    for (const model of this.options.chains[CHAIN_OF[request.task]]) {
      if (this.breaker.isCooling(model)) {
        continue
      }
      const started = Date.now()
      try {
        const value = await this.completeWithModel(model, request)
        this.breaker.recordSuccess(model)
        logger.info({ task: request.task, model, durationMs: Date.now() - started }, 'Panggilan AI berhasil')
        return value
      } catch (error) {
        this.breaker.recordFailure(model)
        logger.warn(
          { task: request.task, model, durationMs: Date.now() - started, reason: reasonOf(error) },
          'Model AI gagal, pindah ke model berikutnya',
        )
      }
    }
    throw new AiUnavailableError()
  }

  // Streams a chat answer. Models are swapped only before the first piece of text, because a swap after
  // text was shown would replace what the user already reads.
  async stream(request: StreamRequest): Promise<{ model: string }> {
    if (this.options.mode === 'mock') {
      await this.playMock(request)
      return { model: 'mock' }
    }

    for (const model of this.options.chains.chat) {
      if (this.breaker.isCooling(model)) {
        continue
      }
      const started = Date.now()
      let emitted = false
      try {
        await streamText(
          this.settings(),
          {
            model,
            messages: request.messages,
            maxTokens: this.options.maxTokens.chat,
            temperature: CHAT_TEMPERATURE,
            timeoutMs: this.options.timeoutMs,
            reasoningEffort: this.options.reasoningEffort,
            signal: request.signal,
          },
          (text) => {
            emitted = true
            request.onDelta(text)
          },
        )
        this.breaker.recordSuccess(model)
        logger.info({ task: 'CHAT', model, durationMs: Date.now() - started }, 'Stream AI selesai')
        return { model }
      } catch (error) {
        if (request.signal.aborted) {
          throw error
        }
        this.breaker.recordFailure(model)
        logger.warn({ task: 'CHAT', model, reason: reasonOf(error) }, 'Stream AI gagal')
        if (emitted) {
          throw error
        }
      }
    }
    throw new AiUnavailableError()
  }

  private settings(): ProviderSettings {
    return { baseUrl: this.options.baseUrl, apiKey: this.options.apiKey, fetchImpl: this.options.fetchImpl }
  }

  private async completeWithModel<T>(model: string, request: CompleteRequest<T>): Promise<T> {
    // JSON tasks get the larger budget. Reasoning models spend part of it before the JSON starts.
    const call = {
      model,
      maxTokens: request.task === 'CHAT' ? this.options.maxTokens.chat : this.options.maxTokens.kuis,
      temperature: JSON_TEMPERATURE,
      timeoutMs: this.options.timeoutMs,
      reasoningEffort: this.options.reasoningEffort,
    }
    const first = await completeText(this.settings(), {
      ...call,
      messages: [
        { role: 'system', content: request.system },
        { role: 'user', content: request.user },
      ],
    })
    const parsed = parseModelOutput(first, request.schema)
    if (parsed.ok) {
      return parsed.value
    }

    // Exactly one repair attempt with the same model (CC-06). The repair is a REPAIR_JSON call.
    const repaired = await completeText(this.settings(), {
      ...call,
      messages: [
        { role: 'system', content: repairSystemPrompt(parsed.error, first) },
        { role: 'user', content: 'Keluarkan JSON yang sudah diperbaiki.' },
      ],
    })
    const second = parseModelOutput(repaired, request.schema)
    if (second.ok) {
      return second.value
    }
    throw new ProviderError('keluaran tidak lolos validasi', null)
  }

  private async playMock(request: StreamRequest): Promise<void> {
    const delay = this.options.mockDelayMs ?? 20
    const pieces = request.mock.split(/(\s+)/).filter((piece) => piece !== '')
    for (let index = 0; index < pieces.length; index += 4) {
      if (request.signal.aborted) {
        throw new DOMException('Stream dibatalkan.', 'AbortError')
      }
      request.onDelta(pieces.slice(index, index + 4).join(''))
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }
}

// A short reason for the logs. The content of the prompt or the answer is never included.
function reasonOf(error: unknown): string {
  if (error instanceof ProviderError) {
    return error.status === null ? error.message : `HTTP ${error.status}`
  }
  if (error instanceof Error) {
    return error.name
  }
  return 'kesalahan'
}
