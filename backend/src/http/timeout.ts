import type { NextFunction, Request, Response } from 'express'
import { config } from '../config/index.js'

// Gives up on a request that takes too long (docs/role.md CC-10). Routes that call AI several times can ask for more time.
export function requestTimeout(milliseconds: number = config.REQUEST_TIMEOUT_MS) {
  return (_req: Request, res: Response, next: NextFunction): void => {
    res.setTimeout(milliseconds, () => {
      if (!res.headersSent) {
        res.status(503).json({ pesan: 'Permintaan terlalu lama. Coba lagi sebentar.' })
      } else {
        res.end()
      }
    })
    next()
  }
}
