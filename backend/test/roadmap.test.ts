import { describe, expect, it } from 'vitest'
import { buildRoadmap, LANE_GAP } from '../src/rencana/roadmap.js'

// Ids are numbered in the order they are made, so the tests can name them.
function idFactory() {
  let next = 0
  return () => `bulat-${++next}`
}

describe('buildRoadmap', () => {
  it('membuat satu jalur per mata pelajaran dan menghubungkan materi berurutan', () => {
    const roadmap = buildRoadmap({
      subjects: ['Matematika', 'IPA'],
      topics: [
        { subject: 'Matematika', name: 'Bilangan' },
        { subject: 'Matematika', name: 'Pecahan' },
        { subject: 'Matematika', name: 'Bangun datar' },
        { subject: 'IPA', name: 'Tubuh manusia' },
      ],
      existingNames: [],
      startY: 110,
      centerX: 280,
      newId: idFactory(),
    })

    expect(roadmap.topics.map((topic) => topic.name)).toEqual(['Bilangan', 'Pecahan', 'Bangun datar', 'Tubuh manusia'])
    expect(roadmap.topics.map((topic) => topic.y)).toEqual([110, 110, 110, 110 + LANE_GAP])
    expect(roadmap.links).toEqual([
      { sourceId: 'bulat-1', targetId: 'bulat-2' },
      { sourceId: 'bulat-2', targetId: 'bulat-3' },
    ])
  })

  it('urutan jalur mengikuti urutan mata pelajaran yang dipilih, bukan urutan katalog', () => {
    const roadmap = buildRoadmap({
      subjects: ['IPA', 'Matematika'],
      topics: [
        { subject: 'Matematika', name: 'Bilangan' },
        { subject: 'IPA', name: 'Tubuh manusia' },
      ],
      existingNames: [],
      startY: 110,
      centerX: 280,
      newId: idFactory(),
    })

    const byName = Object.fromEntries(roadmap.topics.map((topic) => [topic.name, topic.y]))
    expect(byName['Tubuh manusia']).toBe(110)
    expect(byName['Bilangan']).toBe(110 + LANE_GAP)
  })

  it('materi yang namanya sudah dipakai, tanpa memperhatikan huruf besar, dilewati', () => {
    const roadmap = buildRoadmap({
      subjects: ['Matematika'],
      topics: [
        { subject: 'Matematika', name: 'Bilangan' },
        { subject: 'Matematika', name: 'Pecahan' },
      ],
      existingNames: ['  bilangan '],
      startY: 110,
      centerX: 280,
      newId: idFactory(),
    })

    expect(roadmap.topics.map((topic) => topic.name)).toEqual(['Pecahan'])
    expect(roadmap.links).toEqual([])
  })

  it('nama yang sama dua kali dalam satu rencana hanya dibuat sekali', () => {
    const roadmap = buildRoadmap({
      subjects: ['Matematika'],
      topics: [
        { subject: 'Matematika', name: 'Bilangan' },
        { subject: 'Matematika', name: 'BILANGAN' },
      ],
      existingNames: [],
      startY: 110,
      centerX: 280,
      newId: idFactory(),
    })

    expect(roadmap.topics).toHaveLength(1)
  })

  it('setiap jalur dipusatkan di sekitar titik tengah kanvas', () => {
    const roadmap = buildRoadmap({
      subjects: ['Matematika'],
      topics: [
        { subject: 'Matematika', name: 'Bilangan' },
        { subject: 'Matematika', name: 'Pecahan' },
        { subject: 'Matematika', name: 'Bangun datar' },
      ],
      existingNames: [],
      startY: 110,
      centerX: 280,
      newId: idFactory(),
    })

    const xs = roadmap.topics.map((topic) => topic.x)
    expect((Math.min(...xs) + Math.max(...xs)) / 2).toBe(280)
  })

  it('tanpa materi, tidak ada bulat dan tidak ada tautan', () => {
    const roadmap = buildRoadmap({ subjects: ['Matematika'], topics: [], existingNames: [], startY: 110, centerX: 280, newId: idFactory() })
    expect(roadmap).toEqual({ topics: [], links: [] })
  })
})
