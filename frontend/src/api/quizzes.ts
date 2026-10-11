import { z } from 'zod'
import type { QuizLevel, QuizStyle, QuizSettings } from '../domain/quiz'
import { useSessionStore } from '../stores/sessionStore'
import { fetchTopicGraph } from './topics'
import { apiRequest } from './http'

// Quizzes come from the backend. Answer keys stay on the server until a question is answered (docs/api.md, Kuis).

export interface QuizOptionView {
  letter: string
  text: string
}

export interface QuizQuestionView {
  id: string
  position: number
  type: 'PG' | 'CERITA' | 'ISIAN' | 'ESAI'
  stimulusId: string | null
  prompt: string
  options: QuizOptionView[] | null
}

export interface QuizStimulusView {
  id: string
  text: string
}

export interface QuizView {
  id: string
  subject: string
  topicName: string
  level: QuizLevel
  style: QuizStyle
  retry: boolean
  stimuli: QuizStimulusView[]
  questions: QuizQuestionView[]
}

// Result of one answer. Choice and fill-in answers are graded at once. Essays come back with "tersimpan" only.
export interface AnswerView {
  tersimpan: boolean
  skor: number | null
  benar: boolean | null
  kunci: string | null
  pembahasan?: string | null
}

export interface ResultItemView extends QuizQuestionView {
  jawaban: string | null
  skor: number | null
  kunci: string | null
  umpanBalik: string | null
  lowConfidence: boolean
  pembahasan?: string
}

export interface ResultView {
  id: string
  percent: number | null
  benar: number
  total: number
  retry: boolean
  stimuli: QuizStimulusView[]
  items: ResultItemView[]
}

const ANSWER_SCHEMA = z.object({
  tersimpan: z.boolean(),
  skor: z.number().nullable(),
  benar: z.boolean().nullable(),
  kunci: z.string().nullable(),
  pembahasan: z.string().nullable().optional(),
})

// A guest is identified by the device id. Signed-in users are identified by the session cookie.
function identityHeaders(): Record<string, string> | undefined {
  const session = useSessionStore.getState()
  return session.mode === 'guest' ? { 'X-Guest-Id': session.guestId } : undefined
}

export async function fetchQuiz(quizId: string, settings: QuizSettings): Promise<QuizView> {
  const graph = await fetchTopicGraph()
  const topic = graph.topics.find((item) => item.id === quizId)
  const data = await apiRequest(
    'POST',
    '/api/kuis/generate',
    {
      sumberId: quizId,
      topicName: topic?.name,
      mapel: 'Matematika',
      count: settings.count,
      level: settings.level,
      style: settings.style,
    },
    identityHeaders(),
  )
  return z.object({ quiz: quizViewSchema }).parse(data).quiz
}

export async function answerQuizItem(quizId: string, itemId: string, answer: string): Promise<AnswerView> {
  const data = await apiRequest('POST', `/api/kuis/${encodeURIComponent(quizId)}/jawaban/${encodeURIComponent(itemId)}`, { answer }, identityHeaders())
  return ANSWER_SCHEMA.parse(data)
}

export async function submitQuiz(quizId: string): Promise<ResultView> {
  const data = await apiRequest('POST', `/api/kuis/${encodeURIComponent(quizId)}/kumpul`, undefined, identityHeaders())
  return resultViewSchema.parse(data)
}

// A new run with the questions answered wrong. It does not change the saved score.
export async function retryWrongQuestions(quizId: string): Promise<QuizView> {
  const data = await apiRequest('POST', `/api/kuis/${encodeURIComponent(quizId)}/ulangi-salah`, undefined, identityHeaders())
  return z.object({ quiz: quizViewSchema }).parse(data).quiz
}

const optionSchema = z.object({ letter: z.string(), text: z.string() })
const quizViewSchema = z.object({
  id: z.string(),
  subject: z.string(),
  topicName: z.string(),
  level: z.enum(['Mudah', 'Sedang', 'Sulit']),
  style: z.enum(['Campuran', 'Pilihan ganda saja', 'Banyak cerita']),
  retry: z.boolean(),
  stimuli: z.array(z.object({ id: z.string(), text: z.string() })),
  questions: z.array(
    z.object({
      id: z.string(),
      position: z.number(),
      type: z.enum(['PG', 'CERITA', 'ISIAN', 'ESAI']),
      stimulusId: z.string().nullable(),
      prompt: z.string(),
      options: z.array(optionSchema).nullable(),
    }),
  ),
})

const resultViewSchema = z.object({
  id: z.string(),
  percent: z.number().nullable(),
  benar: z.number(),
  total: z.number(),
  retry: z.boolean(),
  stimuli: z.array(z.object({ id: z.string(), text: z.string() })),
  items: z.array(
    z.object({
      id: z.string(),
      position: z.number(),
      type: z.enum(['PG', 'CERITA', 'ISIAN', 'ESAI']),
      stimulusId: z.string().nullable(),
      prompt: z.string(),
      options: z.array(optionSchema).nullable(),
      jawaban: z.string().nullable(),
      skor: z.number().nullable(),
      kunci: z.string().nullable(),
      umpanBalik: z.string().nullable(),
      lowConfidence: z.boolean(),
      pembahasan: z.string().optional(),
    }),
  ),
})
