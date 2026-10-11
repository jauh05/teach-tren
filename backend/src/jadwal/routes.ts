import { Router } from 'express'
import { z } from 'zod'
import { requireUser, userIdOf } from '../auth/requireUser.js'
import { prisma } from '../db.js'
import { AppError } from '../http/errors.js'
import { logger } from '../logger.js'
import { DATE_PATTERN } from './dates.js'
import { buildMemory } from './memory.js'
import { refreshSuggestions } from './suggestions.js'

// The calendar (CC-08). Only signed-in users reach these routes, so guests cannot change the schedule.
export const jadwalRouter = Router()
jadwalRouter.use(requireUser)

// Waits for the suggestion job for at most this long. The job keeps running after a longer wait.
const SUGGESTION_WAIT_MS = 4000

const dateSchema = z.string().regex(DATE_PATTERN, 'Tanggal harus berformat YYYY-MM-DD.')

const createSchema = z.object({
  date: dateSchema,
  title: z.string().trim().min(1, 'Judul tidak boleh kosong.').max(80, 'Judul maksimal 80 karakter.'),
  kind: z.enum(['LATIHAN', 'ULANG', 'BARU', 'ISTIRAHAT']).default('LATIHAN'),
  reason: z.string().trim().max(200).default(''),
})

// Either moves the item to another day, or accepts a suggestion. Moving a suggestion also accepts it.
const updateSchema = z
  .object({
    date: dateSchema.optional(),
    accept: z.boolean().optional(),
  })
  .refine((value) => value.date !== undefined || value.accept !== undefined, {
    message: 'Isi tanggal baru atau terima saran.',
  })

function toItem(item: { id: string; date: string; title: string; kind: string; reason: string }) {
  return { id: item.id, date: item.date, title: item.title, kind: item.kind, reason: item.reason }
}

jadwalRouter.get('/', async (req, res) => {
  const userId = userIdOf(req)
  const job = refreshSuggestions(userId).catch((error: unknown) => {
    logger.warn({ reason: error instanceof Error ? error.name : 'kesalahan' }, 'Pembaruan saran jadwal gagal')
  })
  await Promise.race([job, new Promise((resolve) => setTimeout(resolve, SUGGESTION_WAIT_MS))])

  const items = await prisma.scheduleItem.findMany({
    where: { userId },
    orderBy: [{ date: 'asc' }, { createdAt: 'asc' }],
  })
  res.json({ items: items.map(toItem) })
})

jadwalRouter.post('/item', async (req, res) => {
  const input = createSchema.parse(req.body)
  const item = await prisma.scheduleItem.create({
    data: { userId: userIdOf(req), date: input.date, title: input.title, kind: input.kind, reason: input.reason },
  })
  res.status(201).json({ item: toItem(item) })
})

jadwalRouter.patch('/item/:id', async (req, res) => {
  const input = updateSchema.parse(req.body)
  const userId = userIdOf(req)
  const id = String(req.params.id)
  const current = await prisma.scheduleItem.findFirst({ where: { id, userId } })
  if (!current) {
    throw new AppError(404, 'Item jadwal tidak ditemukan.')
  }
  const accepted = current.kind === 'SARAN' && (input.accept === true || input.date !== undefined)
  const item = await prisma.scheduleItem.update({
    where: { id },
    data: {
      date: input.date ?? current.date,
      kind: accepted ? 'LATIHAN' : current.kind,
    },
  })
  res.json({ item: toItem(item) })
})

jadwalRouter.delete('/item/:id', async (req, res) => {
  const result = await prisma.scheduleItem.deleteMany({ where: { id: String(req.params.id), userId: userIdOf(req) } })
  if (result.count === 0) {
    throw new AppError(404, 'Item jadwal tidak ditemukan.')
  }
  res.status(204).end()
})

// Memory of topics that have a score (the Ingatan AI panel).
export const memoriRouter = Router()
memoriRouter.use(requireUser)

memoriRouter.get('/', async (req, res) => {
  res.json({ entries: await buildMemory(userIdOf(req)) })
})
