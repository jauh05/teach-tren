import { z } from 'zod'
import { apiRequest } from './http'

// Guest device id from the server (docs/role.md CC-01). Requests limited per IP address may be refused.
export async function startGuestSession(): Promise<string> {
  return z.object({ guestId: z.string().uuid() }).parse(await apiRequest('POST', '/api/guest/session')).guestId
}
