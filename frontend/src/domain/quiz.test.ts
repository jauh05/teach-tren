import { describe, expect, it } from 'vitest'
import { progressStates, scoreQuiz, type QuizQuestion } from './quiz'

const questions: QuizQuestion[] = ['q1', 'q2', 'q3', 'q4', 'q5'].map((id) => ({
  id,
  prompt: id,
  options: [
    { letter: 'A', text: 'a' },
    { letter: 'B', text: 'b' },
  ],
  answer: 'B',
  explanation: '',
  stimulusId: null,
}))

describe('scoreQuiz', () => {
  it('menghitung skor persen dari jawaban benar', () => {
    const answers = { q1: 'B', q2: 'B', q3: 'B', q4: 'A', q5: 'B' }
    expect(scoreQuiz(questions, answers)).toEqual({ correct: 4, total: 5, percent: 80 })
  })

  it('soal yang belum dijawab dihitung salah', () => {
    expect(scoreQuiz(questions, { q1: 'B' })).toEqual({ correct: 1, total: 5, percent: 20 })
  })

  it('kuis kosong memberi skor nol', () => {
    expect(scoreQuiz([], {})).toEqual({ correct: 0, total: 0, percent: 0 })
  })
})

describe('progressStates', () => {
  it('menandai benar, salah, aktif, dan belum dijawab', () => {
    const answers = { q1: 'B', q2: 'A' }
    expect(progressStates(questions, answers, 2)).toEqual([
      'correct',
      'wrong',
      'current',
      'pending',
      'pending',
    ])
  })
})
