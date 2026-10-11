import { describe, expect, it } from 'vitest'
import { gradeEssay, gradeFill, normalizeAnswer } from './penilaian'

describe('normalizeAnswer', () => {
  it('menyamakan Rp4.000 dengan 4000 dan mengabaikan huruf besar', () => {
    expect(normalizeAnswer('Rp4.000')).toBe('4000')
    expect(normalizeAnswer('  X = 4000 ')).toBe('x = 4000')
  })
})

describe('gradeFill', () => {
  const accepted = ['4000', 'x = 4000']

  it('menerima jawaban yang sama setelah dinormalisasi', () => {
    expect(gradeFill('4.000', accepted)).toBe(100)
    expect(gradeFill('x=4000', accepted)).toBe(100)
  })

  it('menolak jawaban salah dan jawaban kosong', () => {
    expect(gradeFill('5000', accepted)).toBe(0)
    expect(gradeFill('   ', accepted)).toBe(0)
  })
})

describe('gradeEssay', () => {
  const rubric = [
    { point: 'Memindahkan konstanta', keywords: ['kurangi', 'pindahkan'], weight: 40 },
    { point: 'Membagi dengan koefisien', keywords: ['bagi'], weight: 30 },
    { point: 'Memeriksa hasil', keywords: ['substitusi', 'periksa'], weight: 30 },
  ]

  it('memberi nilai sesuai bobot poin yang terpenuhi', () => {
    const grade = gradeEssay('Pertama kurangi 3000 dari kedua ruas, lalu bagi dengan 2 untuk mendapat hasilnya.', rubric)
    expect(grade.score).toBe(70)
    expect(grade.results.map((item) => item.earned)).toEqual([true, true, false])
  })

  it('menandai jawaban pendek untuk ditinjau', () => {
    expect(gradeEssay('kurangi', rubric).lowConfidence).toBe(true)
  })

  it('jawaban lengkap tidak ditandai', () => {
    const grade = gradeEssay('Pertama kurangi 3000 dari kedua ruas, lalu bagi dengan 2, dan periksa hasilnya.', rubric)
    expect(grade.score).toBe(100)
    expect(grade.lowConfidence).toBe(false)
  })
})
