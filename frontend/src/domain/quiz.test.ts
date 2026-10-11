import { describe, expect, it } from 'vitest'
import {
  displayAnswer,
  parseQuizSettings,
  progressStates,
  scoreQuestion,
  scoreQuiz,
  type ChoiceQuestion,
  type FillQuestion,
  type QuizQuestion,
} from './quiz'

const OPTIONS = [
  { letter: 'A', text: '5' },
  { letter: 'B', text: '7' },
]

const choice = (id: string): ChoiceQuestion => ({
  id,
  type: 'PG',
  prompt: id,
  options: OPTIONS,
  answer: 'B',
  explanation: '',
  stimulusId: null,
})

const fill: FillQuestion = {
  id: 'isian',
  type: 'ISIAN',
  prompt: 'x = ?',
  acceptedAnswers: ['4000'],
  explanation: '',
  stimulusId: null,
}

const essay: QuizQuestion = {
  id: 'esai',
  type: 'ESAI',
  prompt: 'Jelaskan.',
  rubric: [
    { point: 'A', keywords: ['kurangi'], weight: 50 },
    { point: 'B', keywords: ['bagi'], weight: 50 },
  ],
  explanation: '',
  stimulusId: null,
}

const questions: QuizQuestion[] = [choice('q1'), choice('q2'), choice('q3'), choice('q4'), choice('q5')]

describe('scoreQuiz', () => {
  it('menghitung persen dari rata-rata skor soal', () => {
    const answers = { q1: 'B', q2: 'B', q3: 'B', q4: 'A', q5: 'B' }
    expect(scoreQuiz(questions, answers)).toEqual({ correct: 4, total: 5, percent: 80 })
  })

  it('soal yang belum dijawab dihitung nol', () => {
    expect(scoreQuiz(questions, { q1: 'B' })).toEqual({ correct: 1, total: 5, percent: 20 })
  })

  it('kuis kosong memberi skor nol', () => {
    expect(scoreQuiz([], {})).toEqual({ correct: 0, total: 0, percent: 0 })
  })

  it('esai sebagian benar menambah persen tetapi tidak dihitung benar', () => {
    const score = scoreQuiz([essay], { esai: 'kurangi lalu selesai' })
    expect(score).toEqual({ correct: 0, total: 1, percent: 50 })
  })
})

describe('scoreQuestion', () => {
  it('isian diterima jika cocok dengan jawaban yang diterima', () => {
    expect(scoreQuestion(fill, 'Rp4.000')).toBe(100)
    expect(scoreQuestion(fill, '5000')).toBe(0)
  })
})

describe('progressStates', () => {
  it('menandai benar, sebagian, salah, aktif, dan belum dijawab', () => {
    const states = progressStates([choice('q1'), choice('q2'), essay, fill, choice('q5')], { q1: 'B', q2: 'A', esai: 'kurangi' }, 2)
    expect(states).toEqual(['correct', 'wrong', 'partial', 'pending', 'pending'])
  })
})

describe('parseQuizSettings', () => {
  it('memakai nilai dari URL dan default bila tidak valid', () => {
    expect(parseQuizSettings(new URLSearchParams('jumlah=10&tingkat=Sulit&gaya=Banyak+cerita'), false)).toEqual({
      count: 10,
      level: 'Sulit',
      style: 'Banyak cerita',
    })
    expect(parseQuizSettings(new URLSearchParams('jumlah=7&gaya=ngawur'), false)).toEqual({
      count: 5,
      level: 'Sedang',
      style: 'Campuran',
    })
  })

  it('tamu selalu mendapat lima soal', () => {
    expect(parseQuizSettings(new URLSearchParams('jumlah=20'), true).count).toBe(5)
  })
})

describe('displayAnswer', () => {
  it('menormalkan jawaban untuk perbandingan', () => {
    expect(displayAnswer('Rp4.000')).toBe('4000')
    expect(displayAnswer(undefined)).toBe('')
  })
})
