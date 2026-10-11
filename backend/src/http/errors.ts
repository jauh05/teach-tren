import type { NextFunction, Request, Response } from 'express'
import { Prisma } from '../generated/prisma/client.js'
import { z } from 'zod'
import { logger } from '../logger.js'
import { AiUnavailableError } from '../ai/errors.js'

// An error with an HTTP status and a message for the user. The message is always in Bahasa Indonesia.
export class AppError extends Error {
  readonly status: number
  // Short code for the client to act on, for example KUOTA_HABIS. Optional.
  readonly code: string | null

  constructor(status: number, message: string, code: string | null = null) {
    super(message)
    this.status = status
    this.code = code
  }
}

// Every error response has the same shape: { pesan, rincian? }.
export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (error instanceof AppError) {
    res.status(error.status).json(error.code ? { pesan: error.message, kode: error.code } : { pesan: error.message })
    return
  }
  if (error instanceof AiUnavailableError) {
    res.status(503).json({ pesan: error.message, kode: 'AI_TIDAK_TERSEDIA' })
    return
  }
  if (error instanceof z.ZodError) {
    res.status(400).json({
      pesan: 'Data yang dikirim tidak valid.',
      rincian: error.issues.map((issue) => ({ path: issue.path.join('.'), pesan: issue.message })),
    })
    return
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
    res.status(409).json({ pesan: 'Data sudah ada.' })
    return
  }
  if (isBodyParseError(error)) {
    res.status(400).json({ pesan: 'Format data tidak valid.' })
    return
  }
  logger.error({ err: error }, 'Permintaan gagal karena kesalahan server')
  res.status(500).json({ pesan: 'Terjadi kesalahan di server.' })
}

function isBodyParseError(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'type' in error && error.type === 'entity.parse.failed'
}
