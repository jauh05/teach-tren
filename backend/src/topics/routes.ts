import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../db.js'
import { requireUser, userIdOf } from '../auth/requireUser.js'
import { AppError } from '../http/errors.js'
import { SlidingWindowLimiter } from '../chat/rateLimit.js'
import { config } from '../config/index.js'
import { normalizeTopicName, topicNameSchema } from './names.js'
import { freePosition } from './placement.js'
import { suggestPatterns } from './saran.js'

export const topicsRouter = Router()
topicsRouter.use(requireUser)

const percentSchema = z.number().int().min(0, 'Skor minimal 0.').max(100, 'Skor maksimal 100.')
const idSchema = z.string().min(1).max(64)
const createSchema = z.object({ name: topicNameSchema, dariId: idSchema.nullish() })
const linkSchema = z.object({ dariId: idSchema, keId: idSchema })
const suggestSchema = z.object({ polaId: idSchema })
// Passing this score or more means the pattern is finished (docs/role.md 4.1).
const FINISHED_MIN_SCORE = 80
const SUGGEST_WINDOW_MS = 60 * 60 * 1000
const suggestLimiter = new SlidingWindowLimiter(config.POLA_SARAN_PER_HOUR, SUGGEST_WINDOW_MS)

// Returns true when another topic of the same user already has this name (case and spaces ignored).
async function isNameTaken(userId: string, name: string, exceptId: string | null): Promise<boolean> {
  const normalized = normalizeTopicName(name)
  const topics = await prisma.topic.findMany({ where: { userId }, select: { id: true, name: true } })
  return topics.some((topic) => topic.id !== exceptId && normalizeTopicName(topic.name) === normalized)
}

topicsRouter.get('/', async (req, res) => {
  const userId = userIdOf(req)
  const [topics, links, materials] = await Promise.all([
    prisma.topic.findMany({ where: { userId }, orderBy: { createdAt: 'asc' } }),
    prisma.topicLink.findMany({ where: { userId } }),
    prisma.material.findMany({ where: { userId, topicId: { not: null } }, select: { title: true, topicId: true } }),
  ])
  res.json({
    topics: topics.map((topic) => ({
      id: topic.id,
      name: topic.name,
      x: topic.x,
      y: topic.y,
      lastScore: topic.lastScore,
      unlocked: topic.unlocked,
      pendingSuggestion: topic.pendingSuggestion,
      // Titles of the materials linked to this topic.
      materials: materials.filter((material) => material.topicId === topic.id).map((material) => material.title),
    })),
    links: links.map((link) => ({ source: link.sourceId, target: link.targetId, suggested: link.suggested })),
  })
})

// Creates a pattern. With dariId, the new pattern follows that one (a link from it to the new pattern).
topicsRouter.post('/', async (req, res) => {
  const input = createSchema.parse(req.body ?? {})
  const userId = userIdOf(req)
  if (input.dariId && !(await findOwnTopic(userId, input.dariId))) {
    throw new AppError(404, 'Bulat asal tidak ditemukan.')
  }
  if (await isNameTaken(userId, input.name, null)) {
    throw new AppError(409, 'Nama bulat sudah dipakai.')
  }
  const placed = await prisma.topic.findMany({ where: { userId }, select: { x: true, y: true } })
  const spot = freePosition(placed)
  const id = crypto.randomUUID()
  await prisma.$transaction(async (tx) => {
    await tx.topic.create({ data: { userId, id, name: input.name, x: spot.x, y: spot.y } })
    if (input.dariId) {
      await tx.topicLink.create({ data: { userId, sourceId: input.dariId, targetId: id, suggested: false } })
    }
  })
  res.status(201).json({ topic: { id, name: input.name } })
})

// Links two patterns of the account: the source comes before the target.
topicsRouter.post('/tautan', async (req, res) => {
  const input = linkSchema.parse(req.body ?? {})
  const userId = userIdOf(req)
  if (input.dariId === input.keId) {
    throw new AppError(400, 'Bulat tidak bisa dihubungkan ke dirinya sendiri.')
  }
  if (!(await findOwnTopic(userId, input.dariId)) || !(await findOwnTopic(userId, input.keId))) {
    throw new AppError(404, 'Bulat tidak ditemukan.')
  }
  const existing = await prisma.topicLink.findUnique({
    where: { userId_sourceId_targetId: { userId, sourceId: input.dariId, targetId: input.keId } },
  })
  if (existing) {
    throw new AppError(409, 'Kedua bulat sudah terhubung.')
  }
  await prisma.topicLink.create({ data: { userId, sourceId: input.dariId, targetId: input.keId, suggested: false } })
  res.status(201).json({ link: { source: input.dariId, target: input.keId, suggested: false } })
})

// Three patterns that could follow this one. Nothing is created until the user accepts one.
topicsRouter.post('/saran', async (req, res) => {
  const input = suggestSchema.parse(req.body ?? {})
  const userId = userIdOf(req)
  if (!suggestLimiter.take(userId)) {
    throw new AppError(429, 'Saran pola sudah sering diminta. Coba lagi nanti.', 'TERLALU_CEPAT')
  }
  const topic = await findOwnTopic(userId, input.polaId)
  if (!topic) {
    throw new AppError(404, 'Bulat tidak ditemukan.')
  }
  const topics = await prisma.topic.findMany({ where: { userId }, select: { name: true, lastScore: true } })
  const saran = await suggestPatterns({
    name: topic.name,
    existingNames: topics.map((item) => item.name),
    completedNames: topics.filter((item) => item.lastScore !== null && item.lastScore >= FINISHED_MIN_SCORE).map((item) => item.name),
  })
  res.json({ saran })
})

async function findOwnTopic(userId: string, id: string) {
  return prisma.topic.findUnique({ where: { userId_id: { userId, id } } })
}

topicsRouter.patch('/:id', async (req, res) => {
  const name = topicNameSchema.parse(req.body?.name)
  const id = String(req.params.id)
  const topic = await prisma.topic.findUnique({ where: { userId_id: { userId: userIdOf(req), id } } })
  if (!topic) {
    throw new AppError(404, 'Bulat tidak ditemukan.')
  }
  if (await isNameTaken(userIdOf(req), name, id)) {
    throw new AppError(409, 'Nama bulat sudah dipakai.')
  }
  const updated = await prisma.topic.update({
    where: { userId_id: { userId: userIdOf(req), id } },
    data: { name },
  })
  res.json({ topic: { id: updated.id, name: updated.name } })
})

// Records one finished quiz run and makes it the topic's latest score.
topicsRouter.post('/:id/scores', async (req, res) => {
  const percent = percentSchema.parse(req.body?.percent)
  const userId = userIdOf(req)
  const id = String(req.params.id)
  const topic = await prisma.topic.findUnique({ where: { userId_id: { userId, id } } })
  if (!topic) {
    throw new AppError(404, 'Bulat tidak ditemukan.')
  }
  const [, updated] = await prisma.$transaction([
    prisma.quizAttempt.create({ data: { userId, topicId: id, percent } }),
    prisma.topic.update({ where: { userId_id: { userId, id } }, data: { lastScore: percent } }),
  ])
  res.status(201).json({ lastScore: updated.lastScore })
})
