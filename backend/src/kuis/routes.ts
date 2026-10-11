import { Router } from 'express'
import { resolveActor } from '../auth/actor.js'
import { config } from '../config/index.js'
import { AppError } from '../http/errors.js'
import { requestTimeout } from '../http/timeout.js'
import { SlidingWindowLimiter } from '../chat/rateLimit.js'
import { answerQuestion, createQuiz, retryWrong, submitQuiz } from './service.js'

// Batches run in parallel, but a round can retry a batch and a later round may follow (kuis/generate.ts).
// Each AI call may take up to 120 seconds (AI_TIMEOUT_KUIS_MS) and a new attempt may start up to 150 seconds in.
// Six minutes covers the last attempt and its key check.
const GENERATE_TIMEOUT_MS = 360_000
const quizLimiter = new SlidingWindowLimiter(config.QUIZ_RATE_PER_HOUR, 60 * 60 * 1000)

// Quiz routes (docs/api.md). Both guests and signed-in users can take quizzes. The guest limits are checked on the server.
export const kuisRouter = Router()

kuisRouter.post('/generate', requestTimeout(GENERATE_TIMEOUT_MS), async (req, res) => {
  const actor = resolveActor(req)
  // Guests may start a few quizzes per hour, counted per guest and per IP address (docs/role.md CC-10).
  if (actor.kind === 'guest') {
    for (const key of [`guest:${actor.guestId}`, `ip:${req.ip ?? 'tidak-diketahui'}`]) {
      if (!quizLimiter.take(key)) {
        throw new AppError(429, 'Terlalu sering membuat kuis. Coba lagi nanti.', 'TERLALU_CEPAT')
      }
    }
  }
  res.status(201).json(await createQuiz(actor, req.body))
})

kuisRouter.post('/:quizId/jawaban/:itemId', async (req, res) => {
  const actor = resolveActor(req)
  res.json(await answerQuestion(actor, String(req.params.quizId), String(req.params.itemId), req.body))
})

kuisRouter.post('/:quizId/kumpul', async (req, res) => {
  const actor = resolveActor(req)
  res.json(await submitQuiz(actor, String(req.params.quizId)))
})

kuisRouter.post('/:quizId/ulangi-salah', async (req, res) => {
  const actor = resolveActor(req)
  res.status(201).json(await retryWrong(actor, String(req.params.quizId)))
})
