// Shared quiz types. Answer keys exist only on the server.
export const LEVELS = ['Mudah', 'Sedang', 'Sulit'] as const
export const STYLES = ['Campuran', 'Pilihan ganda saja', 'Banyak cerita'] as const
export const QUIZ_COUNTS = [5, 10, 15, 20] as const

export type Level = (typeof LEVELS)[number]
export type Style = (typeof STYLES)[number]
export type QuestionKind = 'PG' | 'CERITA' | 'ISIAN' | 'ESAI'

export interface OptionData {
  letter: string
  text: string
}

export interface RubricData {
  point: string
  // Words that count as covering the point. Used only when the AI grader is not available.
  keywords: string[]
  weight: number
}

export interface StimulusData {
  id: string
  text: string
}

// One question as it is stored in a quiz run. The bank id is kept to reuse the question later.
export interface QuestionData {
  type: QuestionKind
  stimulusId: string | null
  prompt: string
  options: OptionData[] | null
  answer: string | null
  acceptedAnswers: string[]
  rubric: RubricData[] | null
  explanation: string
  bankId: string | null
}
