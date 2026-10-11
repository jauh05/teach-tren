import { Router } from 'express'
import { z } from 'zod'
import { SlidingWindowLimiter } from '../chat/rateLimit.js'
import { config } from '../config/index.js'
import { prisma } from '../db.js'
import { AppError } from '../http/errors.js'
import { seedDefaultTopics } from '../topics/defaultGraph.js'
import { requireUser, userIdOf } from './requireUser.js'
import { hashPassword, verifyPassword } from './password.js'
import { clearSession, createRefreshToken, hashRefreshToken, issueSession, REFRESH_COOKIE, setSessionCookies } from './session.js'

export const authRouter = Router()

const registerSchema = z.object({
  name: z.string().trim().min(1, 'Nama tidak boleh kosong.').max(60, 'Nama maksimal 60 karakter.'),
  email: z.string().trim().toLowerCase().email('Format email tidak valid.'),
  password: z.string().min(8, 'Kata sandi minimal 8 karakter.').max(72, 'Kata sandi maksimal 72 karakter.'),
})

const profileSchema = z.object({
  name: z.string().trim().min(1, 'Nama tidak boleh kosong.').max(60, 'Nama maksimal 60 karakter.'),
})

const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, 'Kata sandi lama wajib diisi.'),
  newPassword: z.string().min(8, 'Kata sandi baru minimal 8 karakter.').max(72, 'Kata sandi baru maksimal 72 karakter.'),
})

const deleteAccountSchema = z.object({
  password: z.string().min(1, 'Kata sandi wajib diisi.'),
})

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().min(1, 'Email wajib diisi.'),
  password: z.string().min(1, 'Kata sandi wajib diisi.'),
})

// Attempt limits (kept in memory, like the other limits). A sign-in attempt counts whether it succeeds or not.
// The per-email key includes the IP address, so someone guessing from elsewhere cannot lock the real owner out.
const FIFTEEN_MINUTES_MS = 15 * 60 * 1000
const signInByEmail = new SlidingWindowLimiter(config.AUTH_ATTEMPTS_PER_15_MIN, FIFTEEN_MINUTES_MS)
const signInByIp = new SlidingWindowLimiter(config.AUTH_IP_PER_15_MIN, FIFTEEN_MINUTES_MS)
const registerByIp = new SlidingWindowLimiter(config.REGISTER_PER_HOUR, 60 * 60 * 1000)

function tooManyAttempts(message: string): AppError {
  return new AppError(429, message, 'TERLALU_CEPAT')
}

// Hash used when the email is unknown, so a wrong email takes as long as a wrong password.
let unknownUserHash: Promise<string> | null = null

function publicUser(user: { id: string; name: string; email: string }) {
  return { id: user.id, name: user.name, email: user.email }
}

authRouter.post('/register', async (req, res) => {
  if (!registerByIp.take(req.ip ?? 'tidak-diketahui')) {
    throw tooManyAttempts('Terlalu banyak pendaftaran dari jaringan ini. Coba lagi nanti.')
  }
  const input = registerSchema.parse(req.body)
  const existing = await prisma.user.findUnique({ where: { email: input.email } })
  if (existing) {
    throw new AppError(409, 'Email sudah terdaftar.')
  }
  const passwordHash = await hashPassword(input.password)
  const user = await prisma.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: { name: input.name, email: input.email, passwordHash },
    })
    if (config.SEED_EXAMPLE_TOPICS) {
      await seedDefaultTopics(tx, created.id)
    }
    return created
  })
  await issueSession(res, user.id)
  res.status(201).json({ user: publicUser(user) })
})

authRouter.post('/login', async (req, res) => {
  const input = loginSchema.parse(req.body)
  const ip = req.ip ?? 'tidak-diketahui'
  if (!signInByIp.take(ip) || !signInByEmail.take(`${input.email}|${ip}`)) {
    throw tooManyAttempts('Terlalu banyak percobaan masuk. Coba lagi dalam beberapa menit.')
  }
  const user = await prisma.user.findUnique({ where: { email: input.email } })
  const hash = user?.passwordHash ?? (await getUnknownUserHash())
  const valid = await verifyPassword(input.password, hash)
  if (!user || !valid) {
    throw new AppError(401, 'Email atau kata sandi salah.')
  }
  // Signing in again during the 30 days after a deletion request restores the account.
  if (user.deletionScheduledAt) {
    await prisma.user.update({ where: { id: user.id }, data: { deletionScheduledAt: null } })
  }
  await issueSession(res, user.id)
  res.json({ user: publicUser(user) })
})

// Gives a new access cookie and a new refresh token. The old refresh token cannot be used again.
authRouter.post('/refresh', async (req, res) => {
  const raw = req.cookies?.[REFRESH_COOKIE]
  const expired = new AppError(401, 'Sesi sudah berakhir. Masuk lagi.')
  if (typeof raw !== 'string') {
    clearSession(res)
    throw expired
  }
  const row = await prisma.refreshToken.findUnique({ where: { tokenHash: hashRefreshToken(raw) } })
  if (!row) {
    clearSession(res)
    throw expired
  }
  if (row.revokedAt) {
    // A token used twice was copied somewhere. Every session of this user ends.
    await prisma.refreshToken.updateMany({ where: { userId: row.userId, revokedAt: null }, data: { revokedAt: new Date() } })
    clearSession(res)
    throw expired
  }
  const user = await prisma.user.findUnique({ where: { id: row.userId } })
  if (row.expiresAt < new Date() || !user) {
    clearSession(res)
    throw expired
  }
  const next = await createRefreshToken(user.id)
  await prisma.refreshToken.update({ where: { id: row.id }, data: { revokedAt: new Date(), replacedById: next.id } })
  setSessionCookies(res, user.id, next.raw)
  res.json({ user: publicUser(user) })
})

authRouter.post('/logout', async (req, res) => {
  const raw = req.cookies?.[REFRESH_COOKIE]
  if (typeof raw === 'string') {
    await prisma.refreshToken.updateMany({ where: { tokenHash: hashRefreshToken(raw), revokedAt: null }, data: { revokedAt: new Date() } })
  }
  clearSession(res)
  res.status(204).end()
})

authRouter.get('/me', requireUser, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: userIdOf(req) } })
  if (!user) {
    clearSession(res)
    throw new AppError(401, 'Silakan masuk dulu.')
  }
  res.json({ user: publicUser(user) })
})

// Changes the display name shown in the profile. The email cannot be changed.
authRouter.patch('/me', requireUser, async (req, res) => {
  const input = profileSchema.parse(req.body)
  const user = await prisma.user.update({ where: { id: userIdOf(req) }, data: { name: input.name } })
  res.json({ user: publicUser(user) })
})

authRouter.post('/password', requireUser, async (req, res) => {
  const input = passwordChangeSchema.parse(req.body)
  const user = await prisma.user.findUnique({ where: { id: userIdOf(req) } })
  if (!user) {
    throw new AppError(401, 'Silakan masuk dulu.')
  }
  if (!(await verifyPassword(input.currentPassword, user.passwordHash))) {
    throw new AppError(400, 'Kata sandi lama tidak sesuai.')
  }
  const passwordHash = await hashPassword(input.newPassword)
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } })
  // Every other device is signed out, because someone else may have known the old password. This device gets a new session.
  await prisma.refreshToken.updateMany({ where: { userId: user.id, revokedAt: null }, data: { revokedAt: new Date() } })
  await issueSession(res, user.id)
  res.status(204).end()
})

// Schedules the deletion. The data is kept for 30 days, and signing in again restores it.
authRouter.delete('/me', requireUser, async (req, res) => {
  const input = deleteAccountSchema.parse(req.body)
  const user = await prisma.user.findUnique({ where: { id: userIdOf(req) } })
  if (!user || !(await verifyPassword(input.password, user.passwordHash))) {
    throw new AppError(400, 'Kata sandi tidak sesuai.')
  }
  await prisma.user.update({ where: { id: user.id }, data: { deletionScheduledAt: new Date() } })
  // Every session of the account ends with the deletion request.
  await prisma.refreshToken.updateMany({ where: { userId: user.id, revokedAt: null }, data: { revokedAt: new Date() } })
  clearSession(res)
  res.status(204).end()
})

function getUnknownUserHash(): Promise<string> {
  unknownUserHash ??= hashPassword('kata-sandi-tidak-dipakai')
  return unknownUserHash
}
