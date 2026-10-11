import type { NextFunction, Request, Response } from 'express'
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

// Guards routes that need a signed-in user. The check happens here, on the server.
export function requireUser(req: Request, _res: Response, next: NextFunction): void {
  const token = req.cookies?.[SESSION_COOKIE]
  const userId = typeof token === 'string' ? readUserId(token) : null
  if (!userId) {
    throw new AppError(401, 'Silakan masuk dulu.')
  }
  req.userId = userId
  next()
}
