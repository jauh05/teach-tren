import { randomUUID } from 'node:crypto'
import type { NextFunction, Request, Response } from 'express'

// Every response carries an X-Request-Id. A valid id from the caller is kept, so logs can be matched across services.
const VALID_ID = /^[A-Za-z0-9_-]{8,100}$/

export function requestId(req: Request, res: Response, next: NextFunction): void {
  const incoming = req.header('x-request-id')
  const id = incoming && VALID_ID.test(incoming) ? incoming : randomUUID()
  req.headers['x-request-id'] = id
  res.setHeader('X-Request-Id', id)
  next()
}
