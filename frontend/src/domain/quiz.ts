// Quiz model and scoring (docs/role.md 4.4, CC-07). Pure functions, covered by unit tests.
import { gradeEssay, gradeFill, normalizeAnswer } from './penilaian'

export type QuestionType = 'PG' | 'CERITA' | 'ISIAN' | 'ESAI'
export type QuizLevel = 'Mudah' | 'Sedang' | 'Sulit'
export type QuizStyle = 'Campuran' | 'Pilihan ganda saja' | 'Banyak cerita'

export interface QuizOption {
  letter: string
  text: string
}

// Long text shared by two or more questions. Shown above the questions that use it.
export interface QuizStimulus {
  id: string
  text: string
}

export interface RubricPoint {
  point: string
  // A point is earned when the answer contains one of these words.
  keywords: string[]
  weight: number
}

interface QuestionBase {
  id: string
  prompt: string
  explanation: string
  stimulusId: string | null
}

export interface ChoiceQuestion extends QuestionBase {
  type: 'PG' | 'CERITA'
  options: QuizOption[]
  // Letter of the correct option.
  answer: string
}

export interface FillQuestion extends QuestionBase {
  type: 'ISIAN'
  acceptedAnswers: string[]
}

export interface EssayQuestion extends QuestionBase {
  type: 'ESAI'
  rubric: RubricPoint[]
}

export type QuizQuestion = ChoiceQuestion | FillQuestion | EssayQuestion

export interface Quiz {
  id: string
  subject: string
  topicName: string
  level: QuizLevel
  style: QuizStyle
  stimuli: QuizStimulus[]
  questions: QuizQuestion[]
}

// Question id to the user's answer: a letter for choice questions, typed text otherwise.
export type Answers = Record<string, string>

export interface QuizScore {
  correct: number
  total: number
  percent: number
}

export const QUESTION_TYPE_LABEL: Record<QuestionType, string> = {
  PG: 'Pilihan ganda',
  CERITA: 'Soal cerita',
  ISIAN: 'Isian singkat',
  ESAI: 'Esai singkat',
}

export function isChoiceQuestion(question: QuizQuestion): question is ChoiceQuestion {
  return question.type === 'PG' || question.type === 'CERITA'
}

// Score for one question, from 0 to 100. An unanswered question scores 0.
export function scoreQuestion(question: QuizQuestion, answer: string | undefined): number {
  if (answer === undefined) {
    return 0
  }
  if (isChoiceQuestion(question)) {
    return answer === question.answer ? 100 : 0
  }
  if (question.type === 'ISIAN') {
    return gradeFill(answer, question.acceptedAnswers)
  }
  return gradeEssay(answer, question.rubric).score
}

// "correct" counts questions that earned the full score. "percent" averages all questions.
export function scoreQuiz(questions: QuizQuestion[], answers: Answers): QuizScore {
  const scores = questions.map((question) => scoreQuestion(question, answers[question.id]))
  const total = questions.length
  const correct = scores.filter((score) => score === 100).length
  const percent = total === 0 ? 0 : Math.round(scores.reduce((sum, score) => sum + score, 0) / total)
  return { correct, total, percent }
}

export type ProgressState = 'correct' | 'partial' | 'wrong' | 'current' | 'pending'

// One state per question, drawn as a segment in the progress bar.
export function progressStates(questions: QuizQuestion[], answers: Answers, currentIndex: number): ProgressState[] {
  return questions.map((question, index) => {
    const answer = answers[question.id]
    if (answer !== undefined) {
      const score = scoreQuestion(question, answer)
      if (score === 100) return 'correct'
      return score > 0 ? 'partial' : 'wrong'
    }
    return index === currentIndex ? 'current' : 'pending'
  })
}

// Quiz settings from the URL (set on the Atur page). Guests are fixed to five questions.
export interface QuizSettings {
  count: number
  level: QuizLevel
  style: QuizStyle
}

export const QUIZ_LEVELS: QuizLevel[] = ['Mudah', 'Sedang', 'Sulit']
export const QUIZ_STYLES: QuizStyle[] = ['Campuran', 'Pilihan ganda saja', 'Banyak cerita']
export const QUIZ_COUNTS = [5, 10, 15, 20] as const

export function parseQuizSettings(params: URLSearchParams, isGuest: boolean): QuizSettings {
  const requested = Number(params.get('jumlah'))
  const count = isGuest ? 5 : (QUIZ_COUNTS as readonly number[]).includes(requested) ? requested : 5
  const level = QUIZ_LEVELS.find((item) => item === params.get('tingkat')) ?? 'Sedang'
  const style = QUIZ_STYLES.find((item) => item === params.get('gaya')) ?? 'Campuran'
  return { count, level, style }
}

// Answer text as the user typed it, normalized for display comparisons.
export function displayAnswer(text: string | undefined): string {
  return text === undefined ? '' : normalizeAnswer(text)
}
