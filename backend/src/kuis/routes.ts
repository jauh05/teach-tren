import { Router } from 'express'
import { resolveActor } from '../auth/actor.js'
import { answerQuestion, createQuiz, retryWrong, submitQuiz } from './service.js'

// Quiz routes (docs/api.md). Both guests and signed-in users can take quizzes. The guest limits are checked on the server.
export const kuisRouter = Router()

kuisRouter.post('/generate', async (req, res) => {
  const actor = resolveActor(req)
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
