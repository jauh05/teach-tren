// Quiz model and scoring. Pure functions, covered by unit tests.

export interface QuizOption {
  letter: string
  text: string
}

// Long text shared by two or more questions. Shown above the questions that use it.
export interface QuizStimulus {
  id: string
  text: string
}

export interface QuizQuestion {
  id: string
  prompt: string
  options: QuizOption[]
  answer: string
  explanation: string
  stimulusId: string | null
}

export interface Quiz {
  id: string
  subject: string
  topicName: string
  level: string
  style: string
  stimuli: QuizStimulus[]
  questions: QuizQuestion[]
}

// Question id to the letter the user chose.
export type Answers = Record<string, string>

export interface QuizScore {
  correct: number
  total: number
  percent: number
}

export function scoreQuiz(questions: QuizQuestion[], answers: Answers): QuizScore {
  const correct = questions.filter((question) => answers[question.id] === question.answer).length
  const total = questions.length
  const percent = total === 0 ? 0 : Math.round((correct / total) * 100)
  return { correct, total, percent }
}

export type ProgressState = 'correct' | 'wrong' | 'current' | 'pending'

// One state per question, drawn as a segment in the progress bar.
export function progressStates(questions: QuizQuestion[], answers: Answers, currentIndex: number): ProgressState[] {
  return questions.map((question, index) => {
    const chosen = answers[question.id]
    if (chosen !== undefined) {
      return chosen === question.answer ? 'correct' : 'wrong'
    }
    return index === currentIndex ? 'current' : 'pending'
  })
}
