// Calls to OpenRouter's OpenAI-compatible chat endpoint. One call uses one model.

export interface ProviderMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface ProviderCall {
  model: string
  messages: ProviderMessage[]
  maxTokens: number
  temperature: number
  timeoutMs: number
  signal?: AbortSignal
}

export interface ProviderSettings {
  baseUrl: string
  apiKey: string
  fetchImpl: typeof fetch
}

// Any failure of one model: rate limit, server error, timeout, or a broken response.
// The service moves on to the next model in the chain when it sees this error.
export class ProviderError extends Error {
  readonly status: number | null

  constructor(message: string, status: number | null) {
    super(message)
    this.name = 'ProviderError'
    this.status = status
  }
}

function requestSignal(call: ProviderCall): AbortSignal {
  const timeout = AbortSignal.timeout(call.timeoutMs)
  return call.signal ? AbortSignal.any([timeout, call.signal]) : timeout
}

async function post(settings: ProviderSettings, call: ProviderCall, stream: boolean): Promise<Response> {
  let response: Response
  try {
    response = await settings.fetchImpl(`${settings.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${settings.apiKey}`,
        'Content-Type': 'application/json',
        'X-Title': 'Teach Tren',
      },
      body: JSON.stringify({
        model: call.model,
        messages: call.messages,
        max_tokens: call.maxTokens,
        temperature: call.temperature,
        stream,
      }),
      signal: requestSignal(call),
    })
  } catch (error) {
    if (error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError')) {
      if (call.signal?.aborted) {
        throw error
      }
      throw new ProviderError('timeout', null)
    }
    throw new ProviderError('jaringan', null)
  }
  if (!response.ok) {
    throw new ProviderError(`HTTP ${response.status}`, response.status)
  }
  return response
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

// Text of the first choice of a complete (non-streaming) response.
export function contentOf(payload: unknown): string | null {
  if (!isRecord(payload) || !Array.isArray(payload.choices) || !isRecord(payload.choices[0])) {
    return null
  }
  const message = payload.choices[0].message
  return isRecord(message) && typeof message.content === 'string' ? message.content : null
}

export async function completeText(settings: ProviderSettings, call: ProviderCall): Promise<string> {
  const response = await post(settings, call, false)
  const content = contentOf(await response.json().catch(() => null))
  if (content === null) {
    throw new ProviderError('respons tidak berisi teks', response.status)
  }
  return content
}

// Text of one server-sent event line. Returns "end" for the final marker.
export function readStreamLine(line: string): { end: true } | { end: false; text: string } {
  if (!line.startsWith('data:')) {
    return { end: false, text: '' }
  }
  const data = line.slice('data:'.length).trim()
  if (data === '[DONE]') {
    return { end: true }
  }
  let payload: unknown
  try {
    payload = JSON.parse(data)
  } catch {
    return { end: false, text: '' }
  }
  if (isRecord(payload) && 'error' in payload) {
    throw new ProviderError('kesalahan di tengah stream', null)
  }
  if (!isRecord(payload) || !Array.isArray(payload.choices) || !isRecord(payload.choices[0])) {
    return { end: false, text: '' }
  }
  const delta = payload.choices[0].delta
  return { end: false, text: isRecord(delta) && typeof delta.content === 'string' ? delta.content : '' }
}

// Streams one answer. Each piece of text is passed to onDelta as soon as it arrives.
export async function streamText(
  settings: ProviderSettings,
  call: ProviderCall,
  onDelta: (text: string) => void,
): Promise<string> {
  const response = await post(settings, call, true)
  if (!response.body) {
    throw new ProviderError('stream kosong', response.status)
  }
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let full = ''

  const handleLine = (line: string): boolean => {
    const event = readStreamLine(line.trim())
    if (event.end) {
      return true
    }
    if (event.text !== '') {
      full += event.text
      onDelta(event.text)
    }
    return false
  }

  for (;;) {
    const { done, value } = await reader.read()
    if (done) {
      break
    }
    buffer += decoder.decode(value, { stream: true })
    let newline = buffer.indexOf('\n')
    while (newline >= 0) {
      const line = buffer.slice(0, newline)
      buffer = buffer.slice(newline + 1)
      if (handleLine(line)) {
        return full
      }
      newline = buffer.indexOf('\n')
    }
  }
  if (buffer.trim() !== '') {
    handleLine(buffer)
  }
  return full
}
