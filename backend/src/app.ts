import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import { pinoHttp } from 'pino-http'
import { authRouter } from './auth/routes.js'
import { chatRouter } from './chat/routes.js'
import { jadwalRouter, memoriRouter } from './jadwal/routes.js'
import { kuisRouter } from './kuis/routes.js'
import { pengaturanRouter } from './pengaturan/routes.js'
import { guestRouter } from './guest/routes.js'
import { conversationsRouter } from './conversations/routes.js'
import { errorHandler } from './http/errors.js'
import { requestId } from './http/requestId.js'
import { requestTimeout } from './http/timeout.js'
import { config } from './config/index.js'
import { logger } from './logger.js'
import { materiRouter } from './materi/routes.js'
import { topicsRouter } from './topics/routes.js'
import { kurikulumRouter, rencanaRouter } from './rencana/routes.js'

export interface AppOptions {
  corsOrigin: string
}

// Builds the Express app. Tests call this directly, without starting a server.
export function createApp(options: AppOptions) {
  const app = express()
  app.disable('x-powered-by')
  // Behind a reverse proxy, req.ip must be the client and not the proxy. Otherwise every limit would apply to one address.
  if (config.TRUST_PROXY > 0) {
    app.set('trust proxy', config.TRUST_PROXY)
  }
  app.use(helmet())
  app.use(requestId)
  app.use(pinoHttp({ logger, genReqId: (req) => String(req.headers['x-request-id']) }))
  app.use(requestTimeout(config.REQUEST_TIMEOUT_MS))
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
  app.use('/api/kurikulum', kurikulumRouter)
  app.use('/api/rencana', rencanaRouter)
  app.use('/api/materi', materiRouter)
  app.use('/api/jadwal', jadwalRouter)
  app.use('/api/memori', memoriRouter)
  app.use('/api/kuis', kuisRouter)
  app.use('/api/pengaturan', pengaturanRouter)
  app.use('/api/guest', guestRouter)

  app.use((_req, res) => {
    res.status(404).json({ pesan: 'Alamat tidak ditemukan.' })
  })
  app.use(errorHandler)
  return app
}
