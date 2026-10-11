// Small wrapper around fetch for the backend API. The session travels in httpOnly cookies,
// so every request sends credentials and no token is ever read by page code.

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

// An error from the server. The message is the Bahasa Indonesia text from the backend (field "pesan").
export class ApiError extends Error {
  readonly status: number
  // Short code from the server, for example KUOTA_HABIS. Null when the server sent none.
  readonly code: string | null

  constructor(status: number, message: string, code: string | null = null) {
    super(message)
    this.status = status
    this.code = code
  }
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api'

// Full address of an API path such as /api/topics.
export function apiUrl(path: string): string {
  return `${API_BASE_URL}${path.replace(/^\/api/, '')}`
}

// One refresh at a time. Requests that fail together share the same refresh.
let refreshing: Promise<boolean> | null = null

// Asks the server for a new access cookie. Returns false when the session has ended.
export function refreshSession(): Promise<boolean> {
  refreshing ??= fetch(apiUrl('/api/auth/refresh'), { method: 'POST', credentials: 'include' })
    .then((response) => response.ok)
    .catch(() => false)
    .finally(() => {
      refreshing = null
    })
  return refreshing
}

// Plain objects are sent as JSON. FormData (file uploads) is sent as it is, so the browser sets its boundary.
// When the access cookie has expired, the session is refreshed once and the request is sent again.
export async function apiRequest(
  method: HttpMethod,
  path: string,
  body?: unknown,
  extraHeaders?: Record<string, string>,
): Promise<unknown> {
  const response = await send(method, path, body, extraHeaders)
  if (response.status === 401 && !path.startsWith('/api/auth/') && (await refreshSession())) {
    return read(await send(method, path, body, extraHeaders))
  }
  return read(response)
}

async function send(method: HttpMethod, path: string, body?: unknown, extraHeaders?: Record<string, string>): Promise<Response> {
  const isForm = body instanceof FormData
  try {
    return await fetch(apiUrl(path), {
      method,
      credentials: 'include',
      headers: { ...(body === undefined || isForm ? {} : { 'Content-Type': 'application/json' }), ...extraHeaders },
      body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
    })
  } catch {
    throw new ApiError(0, 'Tidak bisa terhubung ke server. Coba lagi sebentar.')
  }
}

async function read(response: Response): Promise<unknown> {
  if (response.status === 204) {
    return undefined
  }
  const payload: unknown = await response.json().catch(() => null)
  if (!response.ok) {
    throw new ApiError(response.status, messageOf(payload) ?? 'Terjadi kesalahan. Coba lagi.', codeOf(payload))
  }
  return payload
}

export function codeOf(payload: unknown): string | null {
  return typeof payload === 'object' && payload !== null && 'kode' in payload && typeof payload.kode === 'string'
    ? payload.kode
    : null
}

export function messageOf(payload: unknown): string | null {
  if (typeof payload === 'object' && payload !== null && 'pesan' in payload && typeof payload.pesan === 'string') {
    return payload.pesan
  }
  return null
}
