import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import { pinoHttp } from 'pino-http'
import { authRouter } from './auth/routes.js'
import { chatRouter } from './chat/routes.js'
import { jadwalRouter, memoriRouter } from './jadwal/routes.js'
import { conversationsRouter } from './conversations/routes.js'
import { errorHandler } from './http/errors.js'
import { logger } from './logger.js'
import { materiRouter } from './materi/routes.js'
import { topicsRouter } from './topics/routes.js'

export interface AppOptions {
  corsOrigin: string
}

// Builds the Express app. Tests call this directly, without starting a server.
export function createApp(options: AppOptions) {
  const app = express()
  app.disable('x-powered-by')
  app.use(pinoHttp({ logger }))
  app.use(cors({ origin: options.corsOrigin, credentials: true }))
  app.use(express.json({ limit: '1mb' }))
  app.use(cookieParser())

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' })
  })
  app.use('/api/auth', authRouter)
  app.use('/api/conversations', chatRouter)
  app.use('/api/conversations', conversationsRouter)
  app.use('/api/topics', topicsRouter)
  app.use('/api/materi', materiRouter)
  app.use('/api/jadwal', jadwalRouter)
  app.use('/api/memori', memoriRouter)

  app.use((_req, res) => {
    res.status(404).json({ pesan: 'Alamat tidak ditemukan.' })
  })
  app.use(errorHandler)
  return app
}
