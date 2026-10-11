import type { NextFunction, Request, Response } from 'express'
import { Router } from 'express'
import multer from 'multer'
import { z } from 'zod'
import { requireUser, userIdOf } from '../auth/requireUser.js'
import { prisma } from '../db.js'
import { AppError } from '../http/errors.js'
import { scheduleProcessing } from './processing.js'
import { HEADER_BYTES, MAX_MATERIAL_BYTES, materialTitleOf, validateMaterialFile } from './validation.js'

export const materiRouter = Router()
materiRouter.use(requireUser)

// The file is kept in memory only long enough to check it. Nothing is written to disk.
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: MAX_MATERIAL_BYTES, files: 1 } })

const linkSchema = z.object({
  topicId: z.string().min(1, 'Pilih bulat terlebih dahulu.'),
})

// Reads one uploaded file. Size and form errors become readable messages.
function receiveFile(req: Request, res: Response, next: NextFunction): void {
  upload.single('berkas')(req, res, (error: unknown) => {
    if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
      next(new AppError(400, 'Ukuran berkas maksimal 20 MB.'))
      return
    }
    if (error instanceof multer.MulterError) {
      next(new AppError(400, 'Formulir unggah tidak valid.'))
      return
    }
    next(error)
  })
}

interface MaterialRow {
  id: string
  title: string
  type: string
  sizeBytes: number
  status: string
  summary: string[]
  suggestedTopics: string[]
  error: string | null
  topicId: string | null
}

function toMaterial(row: MaterialRow) {
  return {
    id: row.id,
    title: row.title,
    type: row.type,
    sizeBytes: row.sizeBytes,
    status: row.status,
    summary: row.summary,
    suggestedTopics: row.suggestedTopics,
    linkedTopicId: row.topicId,
    error: row.error,
  }
}

materiRouter.get('/', async (req, res) => {
  const materials = await prisma.material.findMany({
    where: { userId: userIdOf(req) },
    orderBy: { createdAt: 'asc' },
  })
  res.json({ materials: materials.map(toMaterial) })
})

materiRouter.post('/', receiveFile, async (req, res) => {
  const userId = userIdOf(req)
  const file = req.file
  if (!file) {
    throw new AppError(400, 'Pilih berkas terlebih dahulu.')
  }
  const existingCount = await prisma.material.count({ where: { userId } })
  const check = validateMaterialFile({
    name: file.originalname,
    size: file.size,
    header: file.buffer.subarray(0, HEADER_BYTES),
    existingCount,
  })
  if (!check.ok) {
    throw new AppError(check.status, check.message)
  }
  const material = await prisma.material.create({
    data: {
      userId,
      title: materialTitleOf(file.originalname),
      type: check.type,
      sizeBytes: file.size,
      status: 'MEMPROSES',
    },
  })
  scheduleProcessing(material.id)
  res.status(201).json({ material: toMaterial(material) })
})

// Links a material to one of the user's topics. The topic must belong to the same user.
materiRouter.post('/:id/link', async (req, res) => {
  const { topicId } = linkSchema.parse(req.body)
  const userId = userIdOf(req)
  const id = String(req.params.id)
  const material = await prisma.material.findFirst({ where: { id, userId } })
  if (!material) {
    throw new AppError(404, 'Materi tidak ditemukan.')
  }
  const topic = await prisma.topic.findUnique({ where: { userId_id: { userId, id: topicId } } })
  if (!topic) {
    throw new AppError(404, 'Bulat tidak ditemukan.')
  }
  const updated = await prisma.material.update({ where: { id }, data: { topicId } })
  res.json({ material: toMaterial(updated) })
})
