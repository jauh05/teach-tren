import { randomUUID } from 'node:crypto'
import type { Request, Response } from 'express'
import { Router } from 'express'
import { z } from 'zod'
import { mockChatAnswer } from '../ai/mock.js'
import { AiUnavailableError } from '../ai/errors.js'
import { ai } from '../ai/index.js'
import { chatSystemPrompt } from '../ai/prompts.js'
import type { ProviderMessage } from '../ai/openrouter.js'
import { SESSION_COOKIE, readUserId } from '../auth/session.js'
import { config } from '../config/index.js'
import { prisma } from '../db.js'
import { AppError } from '../http/errors.js'
import { logger } from '../logger.js'
import { DAILY_MESSAGE_LIMIT, GUEST_ACTION_LIMIT, HISTORY_MAX_MESSAGES, MESSAGE_MAX_CHARS, TITLE_MAX_LENGTH } from './quota.js'
import { SlidingWindowLimiter } from './rateLimit.js'

// Chat answers (docs/api.md, CC-05). Mounted before the conversation routes, which need a signed-in user.
export const chatRouter = Router()

const limiter = new SlidingWindowLimiter(config.CHAT_RATE_PER_MINUTE, 60_000)

type Actor = { kind: 'user'; userId: string } | { kind: 'guest'; guestId: string }

const sendSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, 'Pesan tidak boleh kosong.')
    .max(MESSAGE_MAX_CHARS, 'Pesan maksimal 3000 karakter.'),
  // Earlier messages of this chat, sent by the browser. Only the last few are used.
  history: z
    .array(z.object({ role: z.enum(['user', 'assistant']), content: z.string().max(MESSAGE_MAX_CHARS) }))
    .max(HISTORY_MAX_MESSAGES)
    .default([]),
  topicName: z.string().trim().max(TITLE_MAX_LENGTH).nullable().optional(),
})

// A signed-in user is identified by the session cookie. A guest by the X-Guest-Id header, which must be a UUID.
function resolveActor(req: Request): Actor {
  const token = req.cookies?.[SESSION_COOKIE]
  const userId = typeof token === 'string' ? readUserId(token) : null
  if (userId) {
    return { kind: 'user', userId }
  }
  const guestId = req.header('x-guest-id')
  if (guestId && z.uuid().safeParse(guestId).success) {
    return { kind: 'guest', guestId }
  }
  throw new AppError(401, 'Silakan masuk dulu.')
}

function limitKeys(req: Request, actor: Actor): string[] {
  return [`ip:${req.ip ?? 'tidak-diketahui'}`, actor.kind === 'user' ? `user:${actor.userId}` : `guest:${actor.guestId}`]
}

async function checkQuota(actor: Actor): Promise<void> {
  if (actor.kind === 'guest') {
    const usage = await prisma.guestUsage.findUnique({ where: { guestId: actor.guestId } })
    if ((usage?.actions ?? 0) >= GUEST_ACTION_LIMIT) {
      throw new AppError(429, 'Aksi AI gratis sudah habis. Daftar atau masuk untuk lanjut.', 'KUOTA_HABIS')
    }
    return
  }
  const startOfDay = new Date()
  startOfDay.setUTCHours(0, 0, 0, 0)
  const sent = await prisma.message.count({
    where: { userId: actor.userId, role: 'user', createdAt: { gte: startOfDay } },
  })
  if (sent >= DAILY_MESSAGE_LIMIT) {
    throw new AppError(429, 'Batas 200 pesan per hari sudah tercapai. Coba lagi besok.', 'KUOTA_HABIS')
  }
}

// A guest's action is counted once the answer is finished or was stopped by the guest. Failed answers are not counted.
async function countGuestAction(actor: Actor): Promise<void> {
  if (actor.kind === 'guest') {
    await prisma.guestUsage.upsert({
      where: { guestId: actor.guestId },
      create: { guestId: actor.guestId, actions: 1 },
      update: { actions: { increment: 1 } },
    })
  }
}

// Saves the question, then an empty answer marked as streaming. A new conversation takes its title from the question.
async function saveExchange(userId: string, conversationId: string, content: string): Promise<string> {
  return prisma.$transaction(async (tx) => {
    const title = content.length > TITLE_MAX_LENGTH ? `${content.slice(0, TITLE_MAX_LENGTH - 1)}…` : content
    await tx.conversation.upsert({
      where: { userId_id: { userId, id: conversationId } },
      create: { userId, id: conversationId, title },
      update: { updatedAt: new Date() },
    })
    const existing = await tx.message.count({ where: { userId, conversationId } })
    await tx.message.create({
      data: { id: randomUUID(), userId, conversationId, role: 'user', content, status: 'done', position: existing },
    })
    const assistantId = randomUUID()
    await tx.message.create({
      data: { id: assistantId, userId, conversationId, role: 'assistant', content: '', status: 'streaming', position: existing + 1 },
    })
    return assistantId
  })
}

async function finishAnswer(userId: string, conversationId: string, messageId: string, content: string, status: 'done' | 'stopped') {
  await prisma.message.updateMany({
    where: { userId, conversationId, id: messageId },
    data: { content, status },
  })
}

function writeEvent(res: Response, event: string, data: unknown): void {
  if (res.writableEnded || res.destroyed) {
    return
  }
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
}

chatRouter.post('/:conversationId/messages', async (req, res) => {
  const actor = resolveActor(req)
  const input = sendSchema.parse(req.body)
  for (const key of limitKeys(req, actor)) {
    if (!limiter.take(key)) {
      throw new AppError(429, 'Terlalu banyak pesan dalam satu menit. Coba lagi sebentar.', 'TERLALU_CEPAT')
    }
  }
  await checkQuota(actor)

  const conversationId = String(req.params.conversationId)
  const assistantId = actor.kind === 'user' ? await saveExchange(actor.userId, conversationId, input.content) : randomUUID()

  const messages: ProviderMessage[] = [
    { role: 'system', content: chatSystemPrompt(input.topicName ?? null) },
    ...input.history.map((item) => ({ role: item.role, content: item.content })),
    { role: 'user', content: input.content },
  ]

  res.status(200)
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8')
  res.setHeader('Cache-Control', 'no-cache, no-transform')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('X-Accel-Buffering', 'no')
  res.flushHeaders()
  writeEvent(res, 'meta', { conversationId, messageId: assistantId })

  // Closing the connection stops the model call. The partial answer is kept and marked as stopped.
  const controller = new AbortController()
  let finished = false
  res.on('close', () => {
    if (!finished) {
      controller.abort()
    }
  })

  let text = ''
  let succeeded = false
  try {
    await ai.stream({
      messages,
      mock: mockChatAnswer(input.content),
      signal: controller.signal,
      onDelta: (piece) => {
        text += piece
        writeEvent(res, 'delta', { text: piece })
      },
    })
    succeeded = true
  } catch (error) {
    if (!controller.signal.aborted) {
      logger.warn({ reason: error instanceof Error ? error.name : 'kesalahan' }, 'Jawaban AI gagal')
      writeEvent(res, 'error', {
        pesan: error instanceof AiUnavailableError ? error.message : 'Jawaban belum bisa dibuat. Coba lagi.',
        kode: error instanceof AiUnavailableError ? 'AI_TIDAK_TERSEDIA' : 'JAWABAN_GAGAL',
      })
    }
  }
  finished = true

  const status = succeeded ? 'done' : 'stopped'
  if (actor.kind === 'user') {
    await finishAnswer(actor.userId, conversationId, assistantId, text, status)
  }
  if (succeeded || controller.signal.aborted) {
    await countGuestAction(actor)
  }
  if (succeeded) {
    writeEvent(res, 'done', { messageId: assistantId, status: 'done' })
  }
  if (!res.writableEnded) {
    res.end()
  }
})
