import { describe, expect, it } from 'vitest'
import {
  buildPayload,
  canContinue,
  chooseGrade,
  chooseLevel,
  EMPTY_DRAFT,
  MAX_CABANG,
  MAX_SUBJECTS,
  MIN_CABANG,
  nextStep,
  previousStep,
  setRoadmap,
  toggleSubject,
  type DraftRoadmap,
  type PlanDraft,
} from './rencana'

const base: PlanDraft = chooseGrade(chooseLevel(EMPTY_DRAFT, 'sd'), 4)

function roadmapOf(count: number): DraftRoadmap {
  const cabang = Array.from({ length: count }, (_, index) => ({ subject: 'Matematika', name: `Cabang ${index + 1}` }))
  return { sumber: 'ai', cabang }
}

describe('pilihan jenjang dan kelas', () => {
  it('kelas belum bisa dilanjutkan sebelum jenjang dan kelas dipilih', () => {
    expect(canContinue('kelas', EMPTY_DRAFT)).toBe(false)
    expect(canContinue('kelas', chooseLevel(EMPTY_DRAFT, 'sd'))).toBe(false)
    expect(canContinue('kelas', base)).toBe(true)
  })

  it('mengganti jenjang menghapus kelas, mata pelajaran, dan roadmap lama', () => {
    const picked = setRoadmap(toggleSubject(base, 'IPA'), roadmapOf(6))
    expect(chooseLevel(picked, 'smp')).toEqual({ levelId: 'smp', grade: null, subjects: [], roadmap: null })
  })

  it('memilih jenjang yang sama tidak mengubah apa pun', () => {
    expect(chooseLevel(base, 'sd')).toBe(base)
  })
})

describe('mata pelajaran dan roadmap', () => {
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

  it('mengubah mata pelajaran membuat roadmap yang sudah dibuat tidak berlaku lagi', () => {
    const withRoadmap = setRoadmap(toggleSubject(base, 'IPA'), roadmapOf(6))
    expect(withRoadmap.roadmap).not.toBeNull()
    expect(toggleSubject(withRoadmap, 'Matematika').roadmap).toBeNull()
  })

  it('roadmap harus 6 sampai 12 cabang sebelum bisa disimpan', () => {
    const picked = toggleSubject(base, 'IPA')
    expect(canContinue('roadmap', picked)).toBe(false)
    expect(canContinue('roadmap', setRoadmap(picked, roadmapOf(MIN_CABANG - 1)))).toBe(false)
    expect(canContinue('roadmap', setRoadmap(picked, roadmapOf(MIN_CABANG)))).toBe(true)
    expect(canContinue('roadmap', setRoadmap(picked, roadmapOf(MAX_CABANG)))).toBe(true)
    expect(canContinue('roadmap', setRoadmap(picked, roadmapOf(MAX_CABANG + 1)))).toBe(false)
  })
})

describe('urutan langkah', () => {
  it('kelas, mapel, lalu roadmap', () => {
    expect(nextStep('kelas')).toBe('mapel')
    expect(nextStep('mapel')).toBe('roadmap')
    expect(nextStep('roadmap')).toBeNull()
    expect(previousStep('kelas')).toBeNull()
    expect(previousStep('roadmap')).toBe('mapel')
  })
})

describe('isi yang dikirim ke server', () => {
  it('tanpa roadmap yang sah, tidak ada isi', () => {
    expect(buildPayload(EMPTY_DRAFT)).toBeNull()
    expect(buildPayload(toggleSubject(base, 'IPA'))).toBeNull()
  })

  it('berisi pilihan dan cabang roadmap sesuai urutan yang dibuat', () => {
    const cabang = [
      { subject: 'IPA', name: 'Siklus air' },
      { subject: 'Matematika', name: 'Bilangan cacah' },
      { subject: 'Matematika', name: 'Pecahan sederhana' },
      { subject: 'Matematika', name: 'Bangun datar' },
      { subject: 'IPA', name: 'Tubuh manusia' },
      { subject: 'IPA', name: 'Cahaya dan bunyi' },
    ]
    const draft = setRoadmap(toggleSubject(toggleSubject(base, 'IPA'), 'Matematika'), { sumber: 'katalog', cabang })
    expect(buildPayload(draft)).toEqual({
      levelId: 'sd',
      grade: 4,
      subjects: ['IPA', 'Matematika'],
      topics: cabang,
    })
  })
})
