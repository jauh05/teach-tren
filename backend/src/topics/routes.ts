import { Router } from 'express'
import { z } from 'zod'
import { resolveActor } from '../auth/actor.js'
import { requireUser, userIdOf } from '../auth/requireUser.js'
import { prisma } from '../db.js'
import { AppError } from '../http/errors.js'
import { SlidingWindowLimiter } from '../chat/rateLimit.js'
import { config } from '../config/index.js'
import { normalizeTopicName, topicNameSchema } from './names.js'
import { freePosition } from './placement.js'
import { generateMateriBulat } from './materiBulat.js'
import { suggestPatterns } from './saran.js'

export const topicsRouter = Router()

const percentSchema = z.number().int().min(0, 'Skor minimal 0.').max(100, 'Skor maksimal 100.')
const idSchema = z.string().min(1).max(64)
const createSchema = z.object({ name: topicNameSchema, dariId: idSchema.nullish() })
const linkSchema = z.object({ dariId: idSchema, keId: idSchema })
const saranSchema = z
  .object({
    polaId: idSchema.optional(),
    nama: z.string().trim().min(1).max(60).optional(),
    tujuan: z.string().trim().min(1).max(120).optional(),
    // Names of the patterns on the device, sent by a guest so that suggestions do not repeat them.
    sudahAda: z.array(z.string().trim().max(60)).max(10).optional(),
  })
  .refine((value) => value.polaId !== undefined || value.nama !== undefined || value.tujuan !== undefined, {
    message: 'Isi tujuan atau nama pola.',
  })
// Passing this score or more means the pattern is finished (docs/role.md 4.1).
const FINISHED_MIN_SCORE = 80
const HOUR_MS = 60 * 60 * 1000
const suggestLimiter = new SlidingWindowLimiter(config.POLA_SARAN_PER_HOUR, HOUR_MS)
const materiLimiter = new SlidingWindowLimiter(config.MATERI_BULAT_PER_HOUR, HOUR_MS)
// Parts of study material per pattern. Each part is one AI call.
const MAX_MATERI_PER_TOPIC = 20

// Patterns that could come next. A guest may use this with the guest AI quota, once the pattern is on the device.
// A guest sends the pattern name, because the pattern is not on the server. A signed-in user sends the pattern id.
topicsRouter.post('/saran', async (req, res) => {
  const actor = resolveActor(req)
  const input = saranSchema.parse(req.body ?? {})

  if (actor.kind === 'guest') {
    if (input.polaId !== undefined) {
      throw new AppError(400, 'Pola di perangkat ini belum tersimpan di akun. Masuk untuk memakai pola yang tersimpan.')
    }
    await checkGuestGenerate(actor.guestId)
    const saran = await suggestPatterns({
      name: input.nama,
      tujuan: input.tujuan,
      existingNames: input.sudahAda ?? [],
      completedNames: [],
    })
    await countGuestGenerate(actor.guestId)
    res.json({ saran })
    return
  }

  if (!suggestLimiter.take(actor.userId)) {
    throw new AppError(429, 'Saran pola sudah sering diminta. Coba lagi nanti.', 'TERLALU_CEPAT')
  }
  let name = input.nama
  if (input.polaId !== undefined) {
    const topic = await findOwnTopic(actor.userId, input.polaId)
    if (!topic) {
      throw new AppError(404, 'Neuron tidak ditemukan.')
    }
    name = topic.name
  }
  const topics = await prisma.topic.findMany({ where: { userId: actor.userId }, select: { name: true, lastScore: true } })
  const saran = await suggestPatterns({
    name,
    tujuan: input.tujuan,
    existingNames: topics.map((item) => item.name),
    completedNames: topics.filter((item) => item.lastScore !== null && item.lastScore >= FINISHED_MIN_SCORE).map((item) => item.name),
  })
  res.json({ saran })
})

topicsRouter.use(requireUser)

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
      // Mata pelajaran of the topic. The canvas groups topics under a title with this name.
      subject: topic.subject,
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

// Creates a pattern. With dariId, the new pattern follows that one (a link from it to the new pattern), and it takes
// the subject of that pattern. Without dariId, the subject is "Umum".
topicsRouter.post('/', async (req, res) => {
  const input = createSchema.parse(req.body ?? {})
  const userId = userIdOf(req)
  const source = input.dariId ? await findOwnTopic(userId, input.dariId) : null
  if (input.dariId && !source) {
    throw new AppError(404, 'Neuron asal tidak ditemukan.')
  }
  if (await isNameTaken(userId, input.name, null)) {
    throw new AppError(409, 'Nama neuron sudah dipakai.')
  }
  const placed = await prisma.topic.findMany({ where: { userId }, select: { x: true, y: true } })
  const spot = freePosition(placed)
  const id = crypto.randomUUID()
  const subject = source?.subject ?? 'Umum'
  await prisma.$transaction(async (tx) => {
    await tx.topic.create({ data: { userId, id, name: input.name, subject, x: spot.x, y: spot.y } })
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
    throw new AppError(400, 'Neuron tidak bisa dihubungkan ke dirinya sendiri.')
  }
  if (!(await findOwnTopic(userId, input.dariId)) || !(await findOwnTopic(userId, input.keId))) {
    throw new AppError(404, 'Neuron tidak ditemukan.')
  }
  const existing = await prisma.topicLink.findUnique({
    where: { userId_sourceId_targetId: { userId, sourceId: input.dariId, targetId: input.keId } },
  })
  if (existing) {
    throw new AppError(409, 'Kedua neuron sudah terhubung.')
  }
  await prisma.topicLink.create({ data: { userId, sourceId: input.dariId, targetId: input.keId, suggested: false } })
  res.status(201).json({ link: { source: input.dariId, target: input.keId, suggested: false } })
})

async function findOwnTopic(userId: string, id: string) {
  return prisma.topic.findUnique({ where: { userId_id: { userId, id } } })
}

topicsRouter.patch('/:id', async (req, res) => {
  const name = topicNameSchema.parse(req.body?.name)
  const id = String(req.params.id)
  const topic = await prisma.topic.findUnique({ where: { userId_id: { userId: userIdOf(req), id } } })
  if (!topic) {
    throw new AppError(404, 'Neuron tidak ditemukan.')
  }
  if (await isNameTaken(userIdOf(req), name, id)) {
    throw new AppError(409, 'Nama neuron sudah dipakai.')
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
    throw new AppError(404, 'Neuron tidak ditemukan.')
  }
  const [, updated] = await prisma.$transaction([
    prisma.quizAttempt.create({ data: { userId, topicId: id, percent } }),
    prisma.topic.update({ where: { userId_id: { userId, id } }, data: { lastScore: percent } }),
  ])
  res.status(201).json({ lastScore: updated.lastScore })
})

// Study material of one pattern: the parts that the AI has written so far, in order.
topicsRouter.get('/:id/materi-ai', async (req, res) => {
  const userId = userIdOf(req)
  const id = String(req.params.id)
  if (!(await findOwnTopic(userId, id))) {
    throw new AppError(404, 'Neuron tidak ditemukan.')
  }
  const parts = await prisma.generatedMaterial.findMany({ where: { userId, topicId: id }, orderBy: { position: 'asc' } })
  res.json({ materi: parts.map(toMateriView) })
})

// Writes one more part of the study material. One click gives one part, never several.
topicsRouter.post('/:id/materi-ai', async (req, res) => {
  const userId = userIdOf(req)
  const id = String(req.params.id)
  const topic = await findOwnTopic(userId, id)
  if (!topic) {
    throw new AppError(404, 'Neuron tidak ditemukan.')
  }
  if (!materiLimiter.take(userId)) {
    throw new AppError(429, 'Terlalu sering membuat materi. Coba lagi nanti.', 'TERLALU_CEPAT')
  }
  const existing = await prisma.generatedMaterial.findMany({
    where: { userId, topicId: id },
    orderBy: { position: 'asc' },
    select: { title: true, position: true },
  })
  if (existing.length >= MAX_MATERI_PER_TOPIC) {
    throw new AppError(409, `Batas ${MAX_MATERI_PER_TOPIC} bagian materi untuk neuron ini sudah tercapai.`)
  }
  const position = (existing[existing.length - 1]?.position ?? 0) + 1
  const part = await generateMateriBulat({
    topicName: topic.name,
    position,
    previousTitles: existing.map((item) => item.title),
  })
  const created = await prisma.generatedMaterial.create({
    data: { userId, topicId: id, position, title: part.judul, content: part.isi },
  })
  res.status(201).json({ materi: toMateriView(created) })
})

function toMateriView(part: { id: string; position: number; title: string; content: string }) {
  return { id: part.id, position: part.position, judul: part.title, isi: part.content }
}

// A guest may make one neuron with AI on the device. The chat quota is counted separately.
const GUEST_GENERATE_LIMIT = 1

async function checkGuestGenerate(guestId: string): Promise<void> {
  const usage = await prisma.guestUsage.findUnique({ where: { guestId } })
  if ((usage?.generated ?? 0) >= GUEST_GENERATE_LIMIT) {
    throw new AppError(429, 'Generate AI gratis sudah dipakai di perangkat ini. Masuk untuk membuat neuron lagi.', 'KUOTA_HABIS')
  }
}

async function countGuestGenerate(guestId: string): Promise<void> {
  await prisma.guestUsage.upsert({
    where: { guestId },
    create: { guestId, generated: 1 },
    update: { generated: { increment: 1 } },
  })
}
