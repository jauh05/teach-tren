import type { NextFunction, Request, Response } from 'express'
import { z } from 'zod'
import { AppError } from '../http/errors.js'
import { SESSION_COOKIE, readUserId } from './session.js'

declare global {
  namespace Express {
    interface Request {
      // Set by requireUser. Routes behind it can rely on it being present.
      userId?: string
    }
  }
}

// A guest is identified by a valid X-Guest-Id header. Guests who reach a signed-in route get 403 HANYA_MASUK.
export function isGuestRequest(req: Request): boolean {
  const guestId = req.header('x-guest-id')
  return guestId !== undefined && z.uuid().safeParse(guestId).success
}

// Returns the signed-in user's id. Only call it in routes behind requireUser.
export function userIdOf(req: Request): string {
  if (!req.userId) {
    throw new AppError(401, 'Silakan masuk dulu.')
  }
  return req.userId
}

// Guards routes that need a signed-in user. The check happens here, on the server.
export function requireUser(req: Request, _res: Response, next: NextFunction): void {
  const token = req.cookies?.[SESSION_COOKIE]
  const userId = typeof token === 'string' ? readUserId(token) : null
  if (!userId) {
    if (isGuestRequest(req)) {
      throw new AppError(403, 'Fitur ini hanya untuk pengguna yang masuk.', 'HANYA_MASUK')
    }
    throw new AppError(401, 'Silakan masuk dulu.')
  }
  req.userId = userId
  next()
}
