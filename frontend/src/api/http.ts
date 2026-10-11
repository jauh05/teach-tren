// Small wrapper around fetch for the backend API. The session travels in an httpOnly cookie,
// so every request sends credentials and no token is ever read by page code.

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

// An error from the server. The message is the Bahasa Indonesia text from the backend (field "pesan").
export class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api'

// Plain objects are sent as JSON. FormData (file uploads) is sent as it is, so the browser sets its boundary.
export async function apiRequest(method: HttpMethod, path: string, body?: unknown): Promise<unknown> {
  const isForm = body instanceof FormData
  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}${path.replace(/^\/api/, '')}`, {
      method,
      credentials: 'include',
      headers: body === undefined || isForm ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
    })
  } catch {
    throw new ApiError(0, 'Tidak bisa terhubung ke server. Coba lagi sebentar.')
  }

  if (response.status === 204) {
    return undefined
  }
  const payload: unknown = await response.json().catch(() => null)
  if (!response.ok) {
    throw new ApiError(response.status, messageOf(payload) ?? 'Terjadi kesalahan. Coba lagi.')
  }
  return payload
}

function messageOf(payload: unknown): string | null {
  if (typeof payload === 'object' && payload !== null && 'pesan' in payload && typeof payload.pesan === 'string') {
    return payload.pesan
  }
  return null
}
