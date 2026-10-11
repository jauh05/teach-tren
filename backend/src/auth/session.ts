import type { CookieOptions, Response } from 'express'
import jwt from 'jsonwebtoken'
import { config } from '../config/index.js'

// The session lives in an httpOnly cookie, so page scripts cannot read it.
export const SESSION_COOKIE = 'tt_sesi'
const SESSION_DAYS = 7
const SESSION_MS = SESSION_DAYS * 24 * 60 * 60 * 1000

function cookieOptions(maxAge: number): CookieOptions {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.NODE_ENV === 'production',
    path: '/',
    maxAge,
  }
}

export function issueSession(res: Response, userId: string): void {
  const token = jwt.sign({ sub: userId }, config.JWT_SECRET, { algorithm: 'HS256', expiresIn: `${SESSION_DAYS}d` })
  res.cookie(SESSION_COOKIE, token, cookieOptions(SESSION_MS))
}

export function clearSession(res: Response): void {
  res.clearCookie(SESSION_COOKIE, cookieOptions(0))
}

// Returns the user id from a valid, unexpired token. Anything else returns null.
export function readUserId(token: string): string | null {
  try {
    const payload = jwt.verify(token, config.JWT_SECRET, { algorithms: ['HS256'] })
    return typeof payload === 'object' && typeof payload.sub === 'string' ? payload.sub : null
  } catch {
    return null
  }
}
