import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../db.js'
import { requireUser } from '../auth/requireUser.js'
import { AppError } from '../http/errors.js'

export const conversationsRouter = Router()
conversationsRouter.use(requireUser)

const messageSchema = z.object({
  id: z.string().min(1).max(64),
  role: z.enum(['user', 'assistant']),
  content: z.string().max(20000, 'Pesan maksimal 20.000 karakter.'),
  status: z.enum(['streaming', 'done', 'stopped']),
})

const saveSchema = z.object({
  title: z.string().trim().min(1, 'Judul tidak boleh kosong.').max(120, 'Judul maksimal 120 karakter.'),
  messages: z.array(messageSchema).max(500, 'Percakapan maksimal 500 pesan.'),
})

function toSummary(conversation: { id: string; title: string; updatedAt: Date }) {
  return { id: conversation.id, title: conversation.title, updatedAt: conversation.updatedAt.toISOString() }
}

conversationsRouter.get('/', async (req, res) => {
  const conversations = await prisma.conversation.findMany({
    where: { userId: req.userId },
    orderBy: { updatedAt: 'desc' },
  })
  res.json({ conversations: conversations.map(toSummary) })
})

conversationsRouter.get('/:id', async (req, res) => {
  const id = String(req.params.id)
  const conversation = await prisma.conversation.findUnique({
    where: { userId_id: { userId: req.userId ?? '', id } },
    include: { messages: { orderBy: { position: 'asc' } } },
  })
  if (!conversation) {
    throw new AppError(404, 'Percakapan tidak ditemukan.')
  }
  res.json({
    conversation: {
      ...toSummary(conversation),
      messages: conversation.messages.map((message) => ({
        id: message.id,
        role: message.role,
        content: message.content,
        status: message.status,
      })),
    },
  })
})

// Saves the whole conversation. The messages list replaces what was stored before.
conversationsRouter.put('/:id', async (req, res) => {
  const input = saveSchema.parse(req.body)
  const userId = req.userId ?? ''
  const id = String(req.params.id)
  const conversation = await prisma.$transaction(async (tx) => {
    const saved = await tx.conversation.upsert({
      where: { userId_id: { userId, id } },
      create: { userId, id, title: input.title },
      update: { title: input.title },
    })
    await tx.message.deleteMany({ where: { userId, conversationId: id } })
    if (input.messages.length > 0) {
      await tx.message.createMany({
        data: input.messages.map((message, position) => ({
          id: message.id,
          userId,
          conversationId: id,
          role: message.role,
          content: message.content,
          status: message.status,
          position,
        })),
      })
    }
    return saved
  })
  res.json({ conversation: toSummary(conversation) })
})

conversationsRouter.delete('/:id', async (req, res) => {
  const result = await prisma.conversation.deleteMany({
    where: { userId: req.userId, id: String(req.params.id) },
  })
  if (result.count === 0) {
    throw new AppError(404, 'Percakapan tidak ditemukan.')
  }
  res.status(204).end()
})
