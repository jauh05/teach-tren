import { randomUUID } from 'node:crypto'
import { Router } from 'express'
import { SlidingWindowLimiter } from '../chat/rateLimit.js'
import { config } from '../config/index.js'
import { AppError } from '../http/errors.js'

// A guest session is a device id issued by the server (docs/role.md CC-01). Starting sessions is limited per IP address.
export const guestRouter = Router()

const limiter = new SlidingWindowLimiter(config.GUEST_SESSION_RATE_PER_HOUR, 60 * 60 * 1000)

guestRouter.post('/session', (req, res) => {
  if (!limiter.take(`ip:${req.ip ?? 'tidak-diketahui'}`)) {
    throw new AppError(429, 'Terlalu banyak sesi tamu dari jaringan ini. Coba lagi nanti.', 'TERLALU_CEPAT')
  }
  res.status(201).json({ guestId: randomUUID() })
})
