import { describe, expect, it } from 'vitest'
import { isSuggestion, placeItem, type ScheduleItem } from './schedule'

const suggestion: ScheduleItem = {
  id: 's1',
  date: '2026-10-05',
  title: 'Pertidaksamaan',
  kind: 'SARAN',
  tone: 'suggested',
  reason: 'Saran AI',
}

const practice: ScheduleItem = {
  id: 's2',
  date: '2026-10-06',
  title: 'Latihan Persamaan linear',
  kind: 'LATIHAN',
  tone: 'learning',
  reason: 'Skor 72',
}

describe('placeItem', () => {
  it('menerima saran dan mengubahnya menjadi item jadwal biasa', () => {
    const accepted = placeItem(suggestion, '2026-10-07')
    expect(accepted.kind).toBe('LATIHAN')
    expect(accepted.tone).toBe('learning')
    expect(accepted.date).toBe('2026-10-07')
    expect(isSuggestion(accepted)).toBe(false)
  })

  it('memindahkan item biasa tanpa mengubah jenisnya', () => {
    const moved = placeItem(practice, '2026-10-08')
    expect(moved.date).toBe('2026-10-08')
    expect(moved.kind).toBe('LATIHAN')
    expect(moved.tone).toBe('learning')
  })
})
