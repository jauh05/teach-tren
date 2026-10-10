import { describe, expect, it } from 'vitest'
import { topicStatusOf, type TopicCondition } from './topicStatus'

const unlocked: TopicCondition = { lastScore: null, unlocked: true, pendingSuggestion: false }

describe('topicStatusOf', () => {
  it.each<[string, TopicCondition, string]>([
    ['skor 90 menjadi DIKUASAI', { ...unlocked, lastScore: 90 }, 'DIKUASAI'],
    ['skor tepat 80 menjadi DIKUASAI', { ...unlocked, lastScore: 80 }, 'DIKUASAI'],
    ['skor 79 menjadi SEDANG', { ...unlocked, lastScore: 79 }, 'SEDANG'],
    ['skor tepat 50 menjadi SEDANG', { ...unlocked, lastScore: 50 }, 'SEDANG'],
    ['skor 49 menjadi PERLU_DIULANG', { ...unlocked, lastScore: 49 }, 'PERLU_DIULANG'],
    ['topik dari chat tanpa latihan menjadi BARU', unlocked, 'BARU'],
    ['prasyarat belum dikuasai menjadi BELUM_DIBUKA', { ...unlocked, unlocked: false }, 'BELUM_DIBUKA'],
    ['saran belum diterima menjadi SARAN', { ...unlocked, pendingSuggestion: true }, 'SARAN'],
  ])('%s', (_name, condition, expected) => {
    expect(topicStatusOf(condition)).toBe(expected)
  })

  it('skor terbaru menggantikan status sebelumnya, termasuk PERLU_DIULANG ke SEDANG', () => {
    const before = topicStatusOf({ ...unlocked, lastScore: 30 })
    const after = topicStatusOf({ ...unlocked, lastScore: 50 })
    expect(before).toBe('PERLU_DIULANG')
    expect(after).toBe('SEDANG')
  })
})
