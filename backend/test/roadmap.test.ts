import { describe, expect, it } from 'vitest'
import { buildRoadmap, COLUMN_GAP, COLUMNS, ROW_GAP } from '../src/rencana/roadmap.js'

// Ids are numbered in the order they are made, so the tests can name them.
function idFactory() {
  let next = 0
  return () => `bulat-${++next}`
}

const ANCHOR = { x: 280, y: 170 }

function build(subjects: string[], topics: { subject: string; name: string }[], extra: { existingNames?: string[]; minTop?: number | null } = {}) {
  return buildRoadmap({
    subjects,
    topics,
    existingNames: extra.existingNames ?? [],
    anchor: ANCHOR,
    minTop: extra.minTop ?? null,
    newId: idFactory(),
  })
}

describe('buildRoadmap', () => {
  it('menghubungkan cabang berurutan dalam satu mata pelajaran', () => {
    const roadmap = build(
      ['Matematika'],
      ['Bilangan', 'Pecahan', 'Bangun datar', 'Pengukuran'].map((name) => ({ subject: 'Matematika', name })),
    )
    const path = roadmap.links.filter((link) => !link.suggested)
    expect(path).toEqual([
      { sourceId: 'bulat-1', targetId: 'bulat-2', suggested: false },
      { sourceId: 'bulat-2', targetId: 'bulat-3', suggested: false },
      { sourceId: 'bulat-3', targetId: 'bulat-4', suggested: false },
    ])
  })

  it('menyebar ke dua arah, tidak hanya satu garis', () => {
    const roadmap = build(
      ['Matematika'],
      Array.from({ length: 6 }, (_, index) => ({ subject: 'Matematika', name: `Cabang ${index + 1}` })),
    )
    const xs = new Set(roadmap.topics.map((topic) => Math.round(topic.x)))
    const ys = new Set(roadmap.topics.map((topic) => Math.round(topic.y)))
    expect(xs.size).toBeGreaterThan(1)
    expect(ys.size).toBeGreaterThan(1)
    // Every branch has its own place on the canvas.
    const places = new Set(roadmap.topics.map((topic) => `${Math.round(topic.x)}:${Math.round(topic.y)}`))
    expect(places.size).toBe(roadmap.topics.length)
  })

  it('cabang di baris atas dan bawah yang berada di kolom sama dihubungkan dengan tautan putus-putus', () => {
    const roadmap = build(
      ['Matematika'],
      Array.from({ length: 6 }, (_, index) => ({ subject: 'Matematika', name: `Cabang ${index + 1}` })),
    )
    const suggested = roadmap.links.filter((link) => link.suggested)
    // Two rows of three. The row turns at the last column, where the path already links the two items, so that column is not repeated.
    expect(suggested).toHaveLength(COLUMNS - 1)
  })

  it('lebar roadmap muat di kanvas ponsel, dan tetap berada di tengah', () => {
    const roadmap = build(
      ['Matematika'],
      Array.from({ length: 6 }, (_, index) => ({ subject: 'Matematika', name: `Cabang ${index + 1}` })),
    )
    const xs = roadmap.topics.map((topic) => topic.x)
    expect(Math.max(...xs) - Math.min(...xs)).toBeLessThanOrEqual((COLUMNS - 1) * COLUMN_GAP)
    expect((Math.min(...xs) + Math.max(...xs)) / 2).toBe(ANCHOR.x)
  })

  it('setiap mata pelajaran mulai di baris baru, dan jalurnya lanjut ke mata pelajaran berikutnya', () => {
    const roadmap = build(
      ['Matematika', 'IPA'],
      [
        { subject: 'Matematika', name: 'Bilangan' },
        { subject: 'Matematika', name: 'Pecahan' },
        { subject: 'IPA', name: 'Tubuh manusia' },
      ],
    )
    const math = roadmap.topics.filter((topic) => topic.subject === 'Matematika')
    const science = roadmap.topics.find((topic) => topic.subject === 'IPA')
    expect(science?.y).toBeGreaterThan(Math.max(...math.map((topic) => topic.y)))
    expect(roadmap.links).toContainEqual({ sourceId: math[1].id, targetId: science?.id, suggested: false })
  })

  it('nama yang sudah dipakai, tanpa memperhatikan huruf besar, dilewati', () => {
    const roadmap = build(
      ['Matematika'],
      [
        { subject: 'Matematika', name: 'Bilangan' },
        { subject: 'Matematika', name: 'Pecahan' },
      ],
      { existingNames: ['  bilangan '] },
    )
    expect(roadmap.topics.map((topic) => topic.name)).toEqual(['Pecahan'])
    expect(roadmap.links).toEqual([])
  })

  it('nama yang sama dua kali dalam satu rencana hanya dibuat sekali', () => {
    const roadmap = build(
      ['Matematika'],
      [
        { subject: 'Matematika', name: 'Bilangan' },
        { subject: 'Matematika', name: 'BILANGAN' },
      ],
    )
    expect(roadmap.topics).toHaveLength(1)
  })

  it('roadmap tidak naik ke atas bulat yang sudah ada', () => {
    const roadmap = build(['Matematika'], [{ subject: 'Matematika', name: 'Bilangan' }], { minTop: 400 })
    expect(Math.min(...roadmap.topics.map((topic) => topic.y))).toBeGreaterThanOrEqual(400)
    expect(ROW_GAP).toBeGreaterThan(0)
  })

  it('tanpa materi, tidak ada bulat dan tidak ada tautan', () => {
    expect(build(['Matematika'], [])).toEqual({ topics: [], links: [] })
  })
})
