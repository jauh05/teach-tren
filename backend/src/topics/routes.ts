import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../db.js'
import { requireUser, userIdOf } from '../auth/requireUser.js'
import { AppError } from '../http/errors.js'
import { normalizeTopicName, topicNameSchema } from './names.js'

export const topicsRouter = Router()
topicsRouter.use(requireUser)

const percentSchema = z.number().int().min(0, 'Skor minimal 0.').max(100, 'Skor maksimal 100.')

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

topicsRouter.post('/', async (req, res) => {
  const name = topicNameSchema.parse(req.body?.name)
  if (await isNameTaken(userIdOf(req), name, null)) {
    throw new AppError(409, 'Nama bulat sudah dipakai.')
  }
  const topic = await prisma.topic.create({
    data: { userId: userIdOf(req), id: crypto.randomUUID(), name },
  })
  res.status(201).json({ topic: { id: topic.id, name: topic.name } })
})

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
