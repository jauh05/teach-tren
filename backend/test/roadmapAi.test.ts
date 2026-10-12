import { describe, expect, it } from 'vitest'
import { CURRICULUM, findLevel, type CurriculumLevel } from '../src/kurikulum/catalog.js'
import { catalogCabang, cleanCabang, MAX_CABANG, MIN_CABANG, roadmapFromAnswer } from '../src/rencana/roadmapAi.js'

const SD = findLevel('sd') as CurriculumLevel

function cabangFrom(names: string[], mapel: string) {
  return names.map((nama) => ({ mapel, nama }))
}

describe('catalogCabang', () => {
  it('dua mata pelajaran bergantian, sehingga keduanya ada di roadmap', () => {
    const cabang = catalogCabang({ level: SD, grade: 4, subjects: ['Matematika', 'IPA'] })
    expect(cabang.length).toBeGreaterThanOrEqual(MIN_CABANG)
    expect(cabang.length).toBeLessThanOrEqual(MAX_CABANG)
    expect(cabang.slice(0, 2).map((item) => item.mapel)).toEqual(['Matematika', 'IPA'])
  })

  it('jumlah cabang tidak lebih dari 12, walau mata pelajaran banyak dan materinya panjang', () => {
    const sma = findLevel('sma') as CurriculumLevel
    const cabang = catalogCabang({ level: sma, grade: 10, subjects: sma.subjects.map((subject) => subject.name) })
    expect(cabang).toHaveLength(MAX_CABANG)
  })

  it('materi katalog yang kurang dari 6 ditambah cabang latihan', () => {
    const kuliah = findLevel('kuliah') as CurriculumLevel
    const cabang = catalogCabang({ level: kuliah, grade: 1, subjects: ['Bahasa Inggris Akademik'] })
    expect(cabang.length).toBe(MIN_CABANG)
    expect(cabang.slice(3).map((item) => item.nama)).toEqual([
      'Latihan Bahasa Inggris Akademik 1',
      'Latihan Bahasa Inggris Akademik 2',
      'Latihan Bahasa Inggris Akademik 3',
    ])
  })
})

describe('cleanCabang', () => {
  it('membuang mata pelajaran yang tidak dipilih, nama kosong, dan nama yang berulang', () => {
    const cleaned = cleanCabang(
      [
        { mapel: 'Matematika', nama: 'Pecahan' },
        { mapel: 'Fisika', nama: 'Gerak lurus' },
        { mapel: 'Matematika', nama: '   ' },
        { mapel: 'Matematika', nama: 'pecahan' },
        { mapel: 'IPA', nama: 'Tubuh manusia' },
      ],
      ['Matematika', 'IPA'],
    )
    expect(cleaned).toEqual([
      { mapel: 'Matematika', nama: 'Pecahan' },
      { mapel: 'IPA', nama: 'Tubuh manusia' },
    ])
  })

  it('berhenti pada 12 cabang', () => {
    const raw = cabangFrom(Array.from({ length: 15 }, (_, index) => `Cabang ${index + 1}`), 'Matematika')
    expect(cleanCabang(raw, ['Matematika'])).toHaveLength(MAX_CABANG)
  })
})

describe('roadmapFromAnswer', () => {
  const input = { level: SD, grade: 4, subjects: ['Matematika', 'IPA'] }

  it('jawaban AI yang sesuai dipakai, dan sumbernya AI', () => {
    const answer = {
      cabang: [
        ...cabangFrom(['Bilangan', 'Pecahan', 'Bangun datar', 'Pengukuran'], 'Matematika'),
        ...cabangFrom(['Tubuh manusia', 'Siklus air'], 'IPA'),
      ],
    }
    const result = roadmapFromAnswer(answer, input)
    expect(result.sumber).toBe('ai')
    expect(result.cabang).toHaveLength(6)
  })

  it('jawaban AI yang kurang dari 6 cabang diganti daftar kurikulum', () => {
    const answer = { cabang: cabangFrom(['Bilangan', 'Pecahan'], 'Matematika') }
    const result = roadmapFromAnswer(answer, input)
    expect(result.sumber).toBe('katalog')
    expect(result.cabang.length).toBeGreaterThanOrEqual(MIN_CABANG)
  })

  it('jawaban AI yang semuanya di luar mata pelajaran dipilih diganti daftar kurikulum', () => {
    const answer = { cabang: cabangFrom(['Gerak lurus', 'Listrik', 'Gelombang', 'Optik', 'Termal', 'Magnet'], 'Fisika') }
    expect(roadmapFromAnswer(answer, input).sumber).toBe('katalog')
  })
})

describe('daftar kurikulum', () => {
  it('setiap jenjang punya mata pelajaran dengan materi', () => {
    for (const level of CURRICULUM) {
      expect(level.subjects.length).toBeGreaterThan(0)
      for (const subject of level.subjects) {
        expect(subject.topics.length).toBeGreaterThan(0)
      }
    }
  })
})
