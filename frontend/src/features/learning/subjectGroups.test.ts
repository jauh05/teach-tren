import { describe, expect, it } from 'vitest'
import type { Topic } from '../../domain/types'
import { DEFAULT_SUBJECT, SUBJECT_COLORS, isSubjectTitle, subjectGroupsOf, tintOf } from './subjectGroups'

function topicOf(id: string, subject: string): Topic {
  return {
    id,
    name: id,
    subject,
    lastScore: null,
    unlocked: true,
    pendingSuggestion: false,
    conversationCount: 0,
    materials: [],
    initialX: 0,
    initialY: 0,
  }
}

describe('kelompok mata pelajaran di kanvas', () => {
  it('neuron dikelompokkan menurut mata pelajaran, urut dari yang muncul pertama', () => {
    const groups = subjectGroupsOf([topicOf('a', 'Statistika'), topicOf('b', 'Aljabar'), topicOf('c', 'Statistika')])
    expect(groups.map((group) => group.subject)).toEqual(['Statistika', 'Aljabar'])
    expect(groups[0].topicIds).toEqual(['a', 'c'])
    expect(groups[1].topicIds).toEqual(['b'])
  })

  it('setiap kelompok punya warna sendiri, dan warna berulang setelah habis', () => {
    const topics = Array.from({ length: SUBJECT_COLORS.length + 1 }, (_, index) => topicOf(`t${index}`, `Mapel ${index}`))
    const groups = subjectGroupsOf(topics)
    expect(new Set(groups.slice(0, SUBJECT_COLORS.length).map((group) => group.color)).size).toBe(SUBJECT_COLORS.length)
    expect(groups[SUBJECT_COLORS.length].color).toBe(SUBJECT_COLORS[0])
  })

  it('mata pelajaran kosong atau spasi saja masuk ke Umum', () => {
    const groups = subjectGroupsOf([topicOf('a', ''), topicOf('b', '   ')])
    expect(groups).toHaveLength(1)
    expect(groups[0].subject).toBe(DEFAULT_SUBJECT)
    expect(groups[0].topicIds).toEqual(['a', 'b'])
  })

  it('judul mata pelajaran punya id sendiri yang tidak sama dengan id neuron', () => {
    const [group] = subjectGroupsOf([topicOf('a', 'Statistika')])
    expect(isSubjectTitle(group.titleId)).toBe(true)
    expect(isSubjectTitle('a')).toBe(false)
  })

  it('warna dicampur dengan putih: 0 jadi putih, 1 tetap warnanya', () => {
    expect(tintOf('#000000', 0)).toBe('#ffffff')
    expect(tintOf('#000000', 1)).toBe('#000000')
    expect(tintOf('#000000', 0.5)).toBe('#808080')
  })

  it('tanpa neuron tidak ada kelompok', () => {
    expect(subjectGroupsOf([])).toEqual([])
  })
})
