import { describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import { AiUnavailableError } from '../src/ai/errors.js'
import { CircuitBreaker, COOLDOWN_MS } from '../src/ai/breaker.js'
import { AiService, type AiOptions } from '../src/ai/service.js'

const schema = z.object({ jawaban: z.string() })
const VALID = JSON.stringify({ jawaban: 'benar' })

function completion(content: string): Response {
  return new Response(JSON.stringify({ choices: [{ message: { content } }] }), { status: 200 })
}

function failure(status: number): Response {
  return new Response(JSON.stringify({ error: 'gagal' }), { status })
}

// A fake fetch that answers each model from a script. The script returns a Response for each call.
function scripted(answers: Record<string, () => Response>) {
  const calls: string[] = []
  const fetchImpl = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
    const body = JSON.parse(String(init?.body)) as { model: string }
    calls.push(body.model)
    const answer = answers[body.model]
    if (!answer) {
      throw new Error(`model tidak dikenal: ${body.model}`)
    }
    return answer()
  })
  return { fetchImpl: fetchImpl as unknown as typeof fetch, calls }
}

function serviceWith(overrides: Partial<AiOptions>): AiService {
  return new AiService({
    mode: 'live',
    apiKey: 'kunci-uji',
    baseUrl: 'https://model.uji',
    chains: { chat: ['m1', 'm2'], kuis: ['k1', 'k2'], ringan: ['r1'] },
    timeoutMs: { chat: 5000, kuis: 5000, ringan: 5000 },
    maxTokens: { chat: 1200, kuis: 3000 },
    reasoningEffort: { chat: 'low', kuis: 'medium', ringan: 'low' },
    fetchImpl: fetch,
    mockDelayMs: 0,
    ...overrides,
  })
}

const request = {
  task: 'JADWAL_SARAN' as const,
  system: 'sistem',
  user: 'data',
  schema,
  mock: () => VALID,
}

describe('layanan AI', () => {
  it('pindah ke model berikutnya saat model pertama kena limit 429', async () => {
    const { fetchImpl, calls } = scripted({
      r1: () => failure(429),
      r2: () => completion(VALID),
    })
    const service = serviceWith({ fetchImpl, chains: { chat: ['m1'], kuis: ['k1'], ringan: ['r1', 'r2'] } })
    await expect(service.complete(request)).resolves.toEqual({ jawaban: 'benar' })
    expect(calls).toEqual(['r1', 'r2'])
  })

  it('memperbaiki keluaran tidak valid sekali dengan model yang sama', async () => {
    // The first answer is not JSON. The repair call answers with the same model, and that answer is valid.
    let answers = 0
    const repairing = vi.fn(async () => {
      answers += 1
      return answers === 1 ? completion('bukan json') : completion(VALID)
    })
    const service = serviceWith({ fetchImpl: repairing as unknown as typeof fetch, chains: { chat: [], kuis: [], ringan: ['r1'] } })
    await expect(service.complete(request)).resolves.toEqual({ jawaban: 'benar' })
    expect(answers).toBe(2)
  })

  it('circuit breaker mendinginkan model setelah tiga kegagalan berturut-turut', async () => {
    let now = 0
    const breaker = new CircuitBreaker(() => now)
    const { fetchImpl, calls } = scripted({
      r1: () => failure(500),
      r2: () => completion(VALID),
    })
    const service = serviceWith({ fetchImpl, breaker, chains: { chat: [], kuis: [], ringan: ['r1', 'r2'] } })

    for (let attempt = 0; attempt < 3; attempt++) {
      await service.complete(request)
    }
    expect(calls.filter((model) => model === 'r1')).toHaveLength(3)

    // Cooling: r1 is skipped while the cooldown runs.
    calls.length = 0
    await service.complete(request)
    expect(calls).toEqual(['r2'])

    // After the cooldown r1 is tried again.
    now = COOLDOWN_MS + 1
    calls.length = 0
    await service.complete(request)
    expect(calls[0]).toBe('r1')
  })

  it('melempar AiUnavailableError saat semua model gagal', async () => {
    const { fetchImpl } = scripted({ r1: () => failure(503), r2: () => failure(429) })
    const service = serviceWith({ fetchImpl, chains: { chat: [], kuis: [], ringan: ['r1', 'r2'] } })
    await expect(service.complete(request)).rejects.toBeInstanceOf(AiUnavailableError)
  })

  it('mode mock menghasilkan keluaran yang lolos skema tanpa memanggil jaringan', async () => {
    const fetchImpl = vi.fn()
    const service = serviceWith({ mode: 'mock', fetchImpl: fetchImpl as unknown as typeof fetch })
    await expect(service.complete(request)).resolves.toEqual({ jawaban: 'benar' })
    expect(fetchImpl).not.toHaveBeenCalled()
  })

  it('stream meneruskan potongan teks sesuai urutan dari server', async () => {
    const encoder = new TextEncoder()
    const sse = [
      'data: {"choices":[{"delta":{"content":"Halo "}}]}\n\n',
      'data: {"choices":[{"delta":{"content":"dunia"}}]}\n\n',
      'data: [DONE]\n\n',
    ].join('')
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(encoder.encode(sse))
        controller.close()
      },
    })
    const fetchImpl = vi.fn(async () => new Response(body, { status: 200 }))
    const service = serviceWith({ fetchImpl: fetchImpl as unknown as typeof fetch, chains: { chat: ['m1'], kuis: [], ringan: [] } })
    const pieces: string[] = []
    const result = await service.stream({
      messages: [{ role: 'user', content: 'halo' }],
      mock: 'x',
      signal: new AbortController().signal,
      onDelta: (text) => pieces.push(text),
    })
    expect(pieces.join('')).toBe('Halo dunia')
    expect(result.model).toBe('m1')
  })

  it('stream mock memecah jawaban menjadi beberapa potongan', async () => {
    const service = serviceWith({ mode: 'mock' })
    const pieces: string[] = []
    await service.stream({
      messages: [],
      mock: 'satu dua tiga empat lima enam tujuh delapan sembilan',
      signal: new AbortController().signal,
      onDelta: (text) => pieces.push(text),
    })
    expect(pieces.length).toBeGreaterThan(1)
    expect(pieces.join('')).toBe('satu dua tiga empat lima enam tujuh delapan sembilan')
  })
})
