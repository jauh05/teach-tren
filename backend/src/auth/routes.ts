import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../db.js'
import { AppError } from '../http/errors.js'
import { seedDefaultTopics } from '../topics/defaultGraph.js'
import { requireUser } from './requireUser.js'
import { hashPassword, verifyPassword } from './password.js'
import { clearSession, issueSession } from './session.js'

export const authRouter = Router()

const registerSchema = z.object({
  name: z.string().trim().min(1, 'Nama tidak boleh kosong.').max(60, 'Nama maksimal 60 karakter.'),
  email: z.string().trim().toLowerCase().email('Format email tidak valid.'),
  password: z.string().min(8, 'Kata sandi minimal 8 karakter.').max(72, 'Kata sandi maksimal 72 karakter.'),
})

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().min(1, 'Email wajib diisi.'),
  password: z.string().min(1, 'Kata sandi wajib diisi.'),
})

// Hash used when the email is unknown, so a wrong email takes as long as a wrong password.
let unknownUserHash: Promise<string> | null = null

function publicUser(user: { id: string; name: string; email: string }) {
  return { id: user.id, name: user.name, email: user.email }
}

authRouter.post('/register', async (req, res) => {
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
    await seedDefaultTopics(tx, created.id)
    return created
  })
  issueSession(res, user.id)
  res.status(201).json({ user: publicUser(user) })
})

authRouter.post('/login', async (req, res) => {
  const input = loginSchema.parse(req.body)
  const user = await prisma.user.findUnique({ where: { email: input.email } })
  const hash = user?.passwordHash ?? (await getUnknownUserHash())
  const valid = await verifyPassword(input.password, hash)
  if (!user || !valid) {
    throw new AppError(401, 'Email atau kata sandi salah.')
  }
  issueSession(res, user.id)
  res.json({ user: publicUser(user) })
})

authRouter.post('/logout', (_req, res) => {
  clearSession(res)
  res.status(204).end()
})

authRouter.get('/me', requireUser, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.userId } })
  if (!user) {
    clearSession(res)
    throw new AppError(401, 'Silakan masuk dulu.')
  }
  res.json({ user: publicUser(user) })
})

function getUnknownUserHash(): Promise<string> {
  unknownUserHash ??= hashPassword('kata-sandi-tidak-dipakai')
  return unknownUserHash
}
