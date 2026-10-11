import type { Request } from 'express'
import { z } from 'zod'
import { AppError } from '../http/errors.js'
import { SESSION_COOKIE, readUserId } from './session.js'

// Who is making a request: a signed-in user (session cookie) or a guest (X-Guest-Id header with a UUID).
export type Actor = { kind: 'user'; userId: string } | { kind: 'guest'; guestId: string }

export function resolveActor(req: Request): Actor {
  const token = req.cookies?.[SESSION_COOKIE]
  const userId = typeof token === 'string' ? readUserId(token) : null
  if (userId) {
    return { kind: 'user', userId }
  }
  const guestId = req.header('x-guest-id')
  if (guestId && z.uuid().safeParse(guestId).success) {
    return { kind: 'guest', guestId }
  }
  throw new AppError(401, 'Silakan masuk dulu.')
}
