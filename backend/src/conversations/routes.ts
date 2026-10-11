import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../db.js'
import { requireUser, userIdOf } from '../auth/requireUser.js'
import { AppError } from '../http/errors.js'

export const conversationsRouter = Router()
conversationsRouter.use(requireUser)

const messageSchema = z.object({
  id: z.string().min(1).max(64),
  role: z.enum(['user', 'assistant']),
  content: z.string().max(20000, 'Pesan maksimal 20.000 karakter.'),
  status: z.enum(['streaming', 'done', 'stopped']),
})

const renameSchema = z.object({
  title: z.string().trim().min(1, 'Judul tidak boleh kosong.').max(120, 'Judul maksimal 120 karakter.'),
})

const saveSchema = z.object({
  // Optional: without a title, a new conversation takes its first question, and an existing one keeps its title.
  title: z.string().trim().min(1, 'Judul tidak boleh kosong.').max(120, 'Judul maksimal 120 karakter.').optional(),
  messages: z.array(messageSchema).max(500, 'Percakapan maksimal 500 pesan.'),
})

const TITLE_MAX_LENGTH = 60

function truncateTitle(text: string): string {
  return text.length > TITLE_MAX_LENGTH ? `${text.slice(0, TITLE_MAX_LENGTH - 1)}…` : text
}

function toSummary(conversation: { id: string; title: string; updatedAt: Date }) {
  return { id: conversation.id, title: conversation.title, updatedAt: conversation.updatedAt.toISOString() }
}

conversationsRouter.get('/', async (req, res) => {
  const conversations = await prisma.conversation.findMany({
    where: { userId: userIdOf(req) },
    orderBy: { updatedAt: 'desc' },
  })
  res.json({ conversations: conversations.map(toSummary) })
})

conversationsRouter.get('/:id', async (req, res) => {
  const id = String(req.params.id)
  const conversation = await prisma.conversation.findUnique({
    where: { userId_id: { userId: userIdOf(req), id } },
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
  const userId = userIdOf(req)
  const id = String(req.params.id)
  const conversation = await prisma.$transaction(async (tx) => {
    const firstQuestion = input.messages.find((message) => message.role === 'user')?.content
    const saved = await tx.conversation.upsert({
      where: { userId_id: { userId, id } },
      create: { userId, id, title: input.title ?? truncateTitle(firstQuestion ?? 'Percakapan baru') },
      update: input.title === undefined ? {} : { title: input.title },
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

// Guest history carried over after signing in (docs/role.md CC-05). At most two conversations, each only once.
const importSchema = z.object({
  percakapan: z
    .array(
      z.object({
        id: z.string().min(1).max(64),
        title: z.string().trim().min(1).max(120),
        messages: z
          .array(
            z.object({
              id: z.string().min(1).max(64),
              role: z.enum(['user', 'assistant']),
              content: z.string().max(20000),
              status: z.enum(['done', 'stopped', 'streaming']),
            }),
          )
          .max(500),
      }),
    )
    .max(2, 'Impor riwayat tamu paling banyak dua percakapan.'),
})

// Importing twice does not duplicate anything: a conversation that already exists is skipped.
conversationsRouter.post('/import', async (req, res) => {
  const input = importSchema.parse(req.body)
  const userId = userIdOf(req)
  const result = await prisma.$transaction(async (tx) => {
    let imported = 0
    let skipped = 0
    for (const conversation of input.percakapan) {
      const existing = await tx.conversation.findUnique({ where: { userId_id: { userId, id: conversation.id } } })
      if (existing) {
        skipped += 1
        continue
      }
      await tx.conversation.create({
        data: {
          userId,
          id: conversation.id,
          title: conversation.title,
          messages: {
            create: conversation.messages.map((message, position) => ({
              id: message.id,
              role: message.role,
              content: message.content,
              // A stream that was still running when the guest left cannot continue, so it is stopped.
              status: message.status === 'done' ? 'done' : 'stopped',
              position,
            })),
          },
        },
      })
      imported += 1
    }
    return { diimpor: imported, dilewati: skipped }
  })
  res.status(201).json(result)
})

// Renames a conversation without touching its messages.
conversationsRouter.patch('/:id', async (req, res) => {
  const { title } = renameSchema.parse(req.body)
  const userId = userIdOf(req)
  const id = String(req.params.id)
  const result = await prisma.conversation.updateMany({ where: { userId, id }, data: { title } })
  if (result.count === 0) {
    throw new AppError(404, 'Percakapan tidak ditemukan.')
  }
  const conversation = await prisma.conversation.findUniqueOrThrow({ where: { userId_id: { userId, id } } })
  res.json({ conversation: toSummary(conversation) })
})

// Removes every conversation of the signed-in user (Pengaturan > Hapus semua riwayat).
conversationsRouter.delete('/', async (req, res) => {
  await prisma.conversation.deleteMany({ where: { userId: userIdOf(req) } })
  res.status(204).end()
})

conversationsRouter.delete('/:id', async (req, res) => {
  const result = await prisma.conversation.deleteMany({
    where: { userId: userIdOf(req), id: String(req.params.id) },
  })
  if (result.count === 0) {
    throw new AppError(404, 'Percakapan tidak ditemukan.')
  }
  res.status(204).end()
})
