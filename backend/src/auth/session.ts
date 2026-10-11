import { createHash, randomBytes } from 'node:crypto'
import type { CookieOptions, Response } from 'express'
import jwt from 'jsonwebtoken'
import { config } from '../config/index.js'
import { prisma } from '../db.js'

// Two cookies. The access cookie is a short JWT that every request sends. The refresh cookie is only sent to /api/auth,
// and it is a random value whose hash is stored. A refresh token is used once (docs/role.md CC-01).
export const SESSION_COOKIE = 'tt_sesi'
export const REFRESH_COOKIE = 'tt_segar'
const ACCESS_MINUTES = 15
const REFRESH_DAYS = 30
const MINUTE_MS = 60 * 1000
const DAY_MS = 24 * 60 * MINUTE_MS

function cookieOptions(maxAge: number, path: string): CookieOptions {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.NODE_ENV === 'production',
    path,
    maxAge,
  }
}

export function hashRefreshToken(raw: string): string {
  return createHash('sha256').update(raw).digest('hex')
}

// Stores a new refresh token and returns its raw value, which is only ever sent to the browser.
export async function createRefreshToken(userId: string): Promise<{ id: string; raw: string }> {
  const raw = randomBytes(32).toString('base64url')
  const row = await prisma.refreshToken.create({
    data: { userId, tokenHash: hashRefreshToken(raw), expiresAt: new Date(Date.now() + REFRESH_DAYS * DAY_MS) },
  })
  return { id: row.id, raw }
}

export function setSessionCookies(res: Response, userId: string, refreshRaw: string): void {
  const access = jwt.sign({ sub: userId }, config.JWT_SECRET, { algorithm: 'HS256', expiresIn: `${ACCESS_MINUTES}m` })
  res.cookie(SESSION_COOKIE, access, cookieOptions(ACCESS_MINUTES * MINUTE_MS, '/'))
  res.cookie(REFRESH_COOKIE, refreshRaw, cookieOptions(REFRESH_DAYS * DAY_MS, '/api/auth'))
}

export async function issueSession(res: Response, userId: string): Promise<void> {
  const refresh = await createRefreshToken(userId)
  setSessionCookies(res, userId, refresh.raw)
}

export function clearSession(res: Response): void {
  res.clearCookie(SESSION_COOKIE, cookieOptions(0, '/'))
  res.clearCookie(REFRESH_COOKIE, cookieOptions(0, '/api/auth'))
}

// Returns the user id from a valid, unexpired access token. Anything else returns null.
export function readUserId(token: string): string | null {
  try {
    const payload = jwt.verify(token, config.JWT_SECRET, { algorithms: ['HS256'] })
    return typeof payload === 'object' && typeof payload.sub === 'string' ? payload.sub : null
  } catch {
    return null
  }
}
