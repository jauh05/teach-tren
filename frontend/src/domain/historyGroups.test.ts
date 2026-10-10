import { describe, expect, it } from 'vitest'
import { groupConversations, historyGroupOf } from './historyGroups'
import type { Conversation } from './types'

// Fixed "now" in local time: 11 October 2026, 10:00.
const NOW = new Date(2026, 9, 11, 10, 0)

function conversation(id: string, updatedAt: Date): Conversation {
  return { id, title: id, updatedAt: updatedAt.toISOString() }
}

describe('historyGroupOf', () => {
  it.each([
    [new Date(2026, 9, 11, 9, 0), 'today'],
    [new Date(2026, 9, 10, 23, 59), 'yesterday'],
    [new Date(2026, 9, 9, 8, 0), 'last7Days'],
    [new Date(2026, 9, 4, 8, 0), 'last7Days'],
    [new Date(2026, 8, 30, 8, 0), 'older'],
  ])('%s masuk grup %s', (date, expected) => {
    expect(historyGroupOf(date, NOW)).toBe(expected)
  })

  it('menganggap waktu masa depan sebagai hari ini', () => {
    expect(historyGroupOf(new Date(2026, 9, 12, 8, 0), NOW)).toBe('today')
  })
})

describe('groupConversations', () => {
  it('mengurutkan grup dan item terbaru di atas', () => {
    const groups = groupConversations(
      [
        conversation('lama', new Date(2026, 8, 1, 8, 0)),
        conversation('kemarin', new Date(2026, 9, 10, 20, 0)),
        conversation('hari-ini-awal', new Date(2026, 9, 11, 7, 0)),
        conversation('hari-ini-akhir', new Date(2026, 9, 11, 9, 30)),
      ],
      NOW,
    )

    expect(groups.map((group) => group.label)).toEqual(['Hari ini', 'Kemarin', 'Lebih lama'])
    expect(groups[0].items.map((item) => item.id)).toEqual(['hari-ini-akhir', 'hari-ini-awal'])
  })

  it('melewati grup yang kosong', () => {
    expect(groupConversations([], NOW)).toEqual([])
  })
})
