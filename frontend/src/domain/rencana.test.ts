import { describe, expect, it } from 'vitest'
import {
  buildPayload,
  canContinue,
  chooseGrade,
  chooseLevel,
  EMPTY_DRAFT,
  MAX_SUBJECTS,
  nextStep,
  previousStep,
  toggleSubject,
  toggleTopic,
  type CurriculumLevel,
} from './rencana'

const SD: CurriculumLevel = {
  id: 'sd',
  label: 'SD',
  gradeUnit: 'Kelas',
  grades: [1, 2, 3, 4, 5, 6],
  subjects: [
    { name: 'Matematika', topics: ['Bilangan cacah', 'Pecahan sederhana', 'Bangun datar'] },
    { name: 'IPA', topics: ['Tubuh manusia', 'Siklus air'] },
  ],
}

describe('pilihan jenjang dan kelas', () => {
  it('kelas belum bisa dilanjutkan sebelum jenjang dan kelas dipilih', () => {
    expect(canContinue('kelas', EMPTY_DRAFT)).toBe(false)
    expect(canContinue('kelas', chooseLevel(EMPTY_DRAFT, 'sd'))).toBe(false)
    expect(canContinue('kelas', chooseGrade(chooseLevel(EMPTY_DRAFT, 'sd'), 4))).toBe(true)
  })

  it('mengganti jenjang menghapus kelas dan mata pelajaran lama', () => {
    const picked = toggleTopic(toggleSubject(chooseGrade(chooseLevel(EMPTY_DRAFT, 'sd'), 4), 'IPA'), 'IPA', 'Siklus air')
    const changed = chooseLevel(picked, 'smp')
    expect(changed).toEqual({ levelId: 'smp', grade: null, subjects: [], topics: [] })
  })

  it('memilih jenjang yang sama tidak mengubah apa pun', () => {
    const picked = chooseGrade(chooseLevel(EMPTY_DRAFT, 'sd'), 4)
    expect(chooseLevel(picked, 'sd')).toBe(picked)
  })
})

describe('mata pelajaran dan materi', () => {
  const base = chooseGrade(chooseLevel(EMPTY_DRAFT, 'sd'), 4)

  it('mata pelajaran harus dipilih minimal satu', () => {
    expect(canContinue('mapel', base)).toBe(false)
    expect(canContinue('mapel', toggleSubject(base, 'IPA'))).toBe(true)
  })

  it('mata pelajaran dibatasi sampai maksimal', () => {
    let draft = base
    for (let index = 0; index < MAX_SUBJECTS + 2; index += 1) {
      draft = toggleSubject(draft, `Mapel ${index}`)
    }
    expect(draft.subjects).toHaveLength(MAX_SUBJECTS)
  })

  it('mata pelajaran yang dibatalkan ikut menghapus materinya', () => {
    const picked = toggleTopic(toggleSubject(base, 'IPA'), 'IPA', 'Siklus air')
    const removed = toggleSubject(picked, 'IPA')
    expect(removed.subjects).toEqual([])
    expect(removed.topics).toEqual([])
  })

  it('materi dipilih dan dibatalkan dengan ketuk yang sama', () => {
    const once = toggleTopic(toggleSubject(base, 'IPA'), 'IPA', 'Siklus air')
    expect(once.topics).toEqual([{ subject: 'IPA', name: 'Siklus air' }])
    expect(toggleTopic(once, 'IPA', 'Siklus air').topics).toEqual([])
  })

  it('langkah materi boleh dilewati', () => {
    expect(canContinue('materi', base)).toBe(true)
  })
})

describe('urutan langkah', () => {
  it('kelas, mapel, lalu materi', () => {
    expect(nextStep('kelas')).toBe('mapel')
    expect(nextStep('mapel')).toBe('materi')
    expect(nextStep('materi')).toBeNull()
    expect(previousStep('kelas')).toBeNull()
    expect(previousStep('materi')).toBe('mapel')
  })
})

describe('isi yang dikirim ke server', () => {
  it('belum lengkap, tidak ada isi', () => {
    expect(buildPayload(EMPTY_DRAFT, SD)).toBeNull()
  })

  it('materi diurutkan menurut urutan katalog, mata pelajaran tetap menurut urutan pilihan', () => {
    let draft = chooseGrade(chooseLevel(EMPTY_DRAFT, 'sd'), 4)
    draft = toggleSubject(draft, 'IPA')
    draft = toggleSubject(draft, 'Matematika')
    draft = toggleTopic(draft, 'Matematika', 'Bangun datar')
    draft = toggleTopic(draft, 'Matematika', 'Bilangan cacah')
    draft = toggleTopic(draft, 'IPA', 'Siklus air')

    expect(buildPayload(draft, SD)).toEqual({
      levelId: 'sd',
      grade: 4,
      subjects: ['IPA', 'Matematika'],
      topics: [
        { subject: 'IPA', name: 'Siklus air' },
        { subject: 'Matematika', name: 'Bilangan cacah' },
        { subject: 'Matematika', name: 'Bangun datar' },
      ],
    })
  })
})
