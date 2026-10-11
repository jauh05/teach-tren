import { describe, expect, it } from 'vitest'
import { kuisBatchSchema, questionProblems, salvageBatch, type QuestionItem } from '../src/ai/quizSchemas.js'
import { normalizeModelJson } from '../src/ai/normalize.js'

const stimulus = { id: 'S1', teks: 'Toko Sinar Ilmu menjual buku tulis dan pensil dengan harga yang berbeda setiap hari.' }

function pg(nomor: number, overrides: Partial<QuestionItem> = {}): Record<string, unknown> {
  return {
    nomor,
    tipe: 'PG',
    stimulusId: null,
    pertanyaan: `Berapa hasil ${nomor} + ${nomor}?`,
    pilihan: [
      { huruf: 'A', teks: `${nomor}` },
      { huruf: 'B', teks: `${nomor * 2}` },
      { huruf: 'C', teks: `${nomor * 3}` },
      { huruf: 'D', teks: `${nomor * 4}` },
    ],
    kunci: 'B',
    rubrik: null,
    pembahasan: 'Jumlah dua bilangan sama.',
    ...overrides,
  }
}

function esai(nomor: number): Record<string, unknown> {
  return {
    nomor,
    tipe: 'ESAI',
    stimulusId: null,
    pertanyaan: 'Jelaskan langkah menyelesaikan persamaan.',
    pilihan: null,
    kunci: null,
    rubrik: [
      { poin: 'langkah', bobot: 50 },
      { poin: 'hasil', bobot: 30 },
      { poin: 'cek', bobot: 20 },
    ],
    pembahasan: 'Pindahkan suku lalu bagi.',
  }
}

describe('aturan satu soal', () => {
  it('soal pilihan ganda yang benar tidak punya masalah', () => {
    expect(questionProblems(pg(1) as QuestionItem, new Set())).toEqual([])
  })

  it('pilihan yang sama dan kunci di luar A sampai D terdeteksi', () => {
    const same = pg(1, { pilihan: [{ huruf: 'A', teks: '5' }, { huruf: 'B', teks: '5' }, { huruf: 'C', teks: '6' }, { huruf: 'D', teks: '7' }] })
    expect(questionProblems(same as QuestionItem, new Set())).toContain('Keempat pilihan harus berbeda.')
    expect(questionProblems(pg(1, { kunci: 'E' }) as QuestionItem, new Set())).toContain('Kunci soal pilihan ganda harus A, B, C, atau D.')
  })

  it('stimulus yang tidak ada di daftar ditandai', () => {
    expect(questionProblems(pg(1, { stimulusId: 'S9' }) as QuestionItem, new Set(['S1']))).toContain('stimulusId S9 tidak ada di daftar stimulus.')
  })
})

describe('menyelamatkan soal yang benar dari batch', () => {
  it('batch lengkap dan benar menyimpan semua soal', () => {
    const { batch, dropped } = salvageBatch({ stimulus: [stimulus], soal: [pg(1), pg(2), pg(3), esai(4)] }, 4)
    expect(dropped).toBe(0)
    expect(batch.soal).toHaveLength(4)
    expect(batch.stimulus).toHaveLength(1)
  })

  it('satu soal yang rusak dibuang, dan soal lain tetap disimpan', () => {
    const { batch, dropped } = salvageBatch({ stimulus: [stimulus], soal: [pg(1), pg(2, { kunci: 'Z' }), pg(3), pg(4)] }, 4)
    expect(dropped).toBe(1)
    expect(batch.soal).toHaveLength(3)
  })

  it('batch dengan kurang dari jumlah yang diminta tetap menyimpan yang benar', () => {
    const { batch, dropped } = salvageBatch({ stimulus: [stimulus], soal: [pg(1), pg(2), pg(3)] }, 5)
    expect(dropped).toBe(0)
    expect(batch.soal).toHaveLength(3)
  })

  it('soal lebih dari jumlah yang diminta dipotong sampai jumlahnya', () => {
    const { batch } = salvageBatch({ stimulus: [stimulus], soal: [pg(1), pg(2), pg(3), pg(4), pg(5), pg(6)] }, 5)
    expect(batch.soal).toHaveLength(5)
  })

  it('soal yang memakai stimulus rusak ikut dibuang', () => {
    const shortStimulus = { id: 'S1', teks: 'Terlalu pendek.' }
    const { batch, dropped } = salvageBatch({ stimulus: [shortStimulus], soal: [pg(1, { stimulusId: 'S1' }), pg(2)] }, 2)
    expect(dropped).toBe(1)
    expect(batch.soal.map((question) => question.nomor)).toEqual([2])
  })

  it('keluaran yang bukan objek atau tanpa daftar soal tidak menyimpan apa pun', () => {
    expect(salvageBatch('teks', 5).batch.soal).toEqual([])
    expect(salvageBatch({ stimulus: [] }, 5).batch.soal).toEqual([])
  })

  it('aturan batch yang ketat tetap menolak batch yang salah jumlahnya', () => {
    expect(kuisBatchSchema(3).safeParse({ stimulus: [stimulus], soal: [pg(1), pg(2)] }).success).toBe(false)
  })
})

describe('jenis soal mengikuti permintaan', () => {
  const pgOnly = { PG: 5, CERITA: 0, ISIAN: 0, ESAI: 0 }

  it('soal cerita tidak diterima ketika yang diminta hanya pilihan ganda', () => {
    const cerita = pg(3, { tipe: 'CERITA', stimulusId: 'S1' })
    const { batch, dropped } = salvageBatch({ stimulus: [stimulus], soal: [pg(1), cerita, pg(2)] }, 5, pgOnly)
    expect(batch.soal.map((question) => question.tipe)).toEqual(['PG', 'PG'])
    expect(dropped).toBe(1)
  })

  it('jumlah tiap jenis tidak lebih dari yang diminta', () => {
    const kinds = { PG: 2, CERITA: 1, ISIAN: 0, ESAI: 0 }
    const { batch, dropped } = salvageBatch({ stimulus: [stimulus], soal: [pg(1), pg(2), pg(3), pg(4, { tipe: 'CERITA', stimulusId: 'S1' })] }, 3, kinds)
    expect(batch.soal.map((question) => question.tipe)).toEqual(['PG', 'PG', 'CERITA'])
    expect(dropped).toBe(1)
  })
})

describe('JSON yang sedikit rusak', () => {
  it('tanda kutip penutup yang hilang masih bisa dibaca', () => {
    const broken = '{"soal":[{"nomor":1,"pembahasan":"Hasilnya 5","pertanyaan":"Berapa 2 + 3?"}'
    expect(normalizeModelJson(broken)).toMatchObject({ soal: [{ nomor: 1, pertanyaan: 'Berapa 2 + 3?' }] })
  })

  it('JSON yang benar tidak berubah', () => {
    expect(normalizeModelJson('{"a":[1,2]}')).toEqual({ a: [1, 2] })
  })
})
