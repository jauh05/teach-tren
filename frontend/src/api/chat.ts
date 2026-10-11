import type { ChatMessage } from '../domain/types'
import { apiUrl, codeOf, messageOf, ApiError, refreshSession } from './http'

// Chat answers come from the backend as server-sent events: meta, delta, done, or error (docs/api.md).
// Only the last ten finished messages are sent as context, which keeps each request small.
const HISTORY_LIMIT = 10

export interface AnswerRequest {
  conversationId: string
  content: string
  history: { role: 'user' | 'assistant'; content: string }[]
  topicName: string | null
  // Set for guests. The server counts guest actions by this id.
  guestId: string | null
}

export interface AnswerHandlers {
  onDelta: (text: string) => void
}

export type AnswerOutcome = 'done' | 'stopped'

// Finished messages of a chat, in the form the server expects as context.
export function historyOf(messages: ChatMessage[]): AnswerRequest['history'] {
  return messages
    .filter((message) => message.status === 'done' && message.content.trim() !== '')
    .slice(-HISTORY_LIMIT)
    .map((message) => ({ role: message.role, content: message.content }))
}

// Streams one answer. Resolves "done" when the server finished, and "stopped" when the signal aborted.
// Rejects with ApiError for refusals (for example KUOTA_HABIS) and for failures reported by the stream.
export async function streamAnswer(
  request: AnswerRequest,
  handlers: AnswerHandlers,
  signal: AbortSignal,
): Promise<AnswerOutcome> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (request.guestId) {
    headers['X-Guest-Id'] = request.guestId
  }

  const send = () =>
    fetch(apiUrl(`/api/conversations/${encodeURIComponent(request.conversationId)}/messages`), {
      method: 'POST',
      credentials: 'include',
      headers,
      body: JSON.stringify({
        content: request.content,
        history: request.history,
        topicName: request.topicName,
      }),
      signal,
    })
  let response: Response
  try {
    response = await send()
    // The access cookie may have expired during a long chat. One refresh, then the same request again.
    if (response.status === 401 && request.guestId === null && (await refreshSession())) {
      response = await send()
    }
  } catch {
    if (signal.aborted) {
      return 'stopped'
    }
    throw new ApiError(0, 'Tidak bisa terhubung ke server. Coba lagi sebentar.')
  }

  if (!response.ok) {
    const payload: unknown = await response.json().catch(() => null)
    throw new ApiError(response.status, messageOf(payload) ?? 'Jawaban belum bisa dibuat. Coba lagi.', codeOf(payload))
  }
  if (!response.body) {
    throw new ApiError(response.status, 'Jawaban belum bisa dibuat. Coba lagi.')
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let outcome: AnswerOutcome = 'stopped'
  try {
    for (;;) {
      const { done, value } = await reader.read()
      if (done) {
        break
      }
      buffer += decoder.decode(value, { stream: true })
      let boundary = buffer.indexOf('\n\n')
      while (boundary >= 0) {
        const block = buffer.slice(0, boundary)
        buffer = buffer.slice(boundary + 2)
        if (handleBlock(block, handlers) === 'done') {
          outcome = 'done'
        }
        boundary = buffer.indexOf('\n\n')
      }
    }
  } catch (error) {
    if (signal.aborted) {
      return 'stopped'
    }
    throw error
  }
  return outcome
}

// Handles one event. Returns "done" for the final event of a finished answer.
function handleBlock(block: string, handlers: AnswerHandlers): 'done' | 'continue' {
  let event = ''
  let data = ''
  for (const line of block.split('\n')) {
    if (line.startsWith('event: ')) {
      event = line.slice('event: '.length)
    } else if (line.startsWith('data: ')) {
      data += line.slice('data: '.length)
    }
  }
  const payload: unknown = data === '' ? null : JSON.parse(data)
  if (event === 'delta' && typeof payload === 'object' && payload !== null && 'text' in payload && typeof payload.text === 'string') {
    handlers.onDelta(payload.text)
  }
  if (event === 'error') {
    throw new ApiError(0, messageOf(payload) ?? 'Jawaban belum bisa dibuat. Coba lagi.', codeOf(payload))
  }
  return event === 'done' ? 'done' : 'continue'
}
