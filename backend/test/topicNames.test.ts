import { describe, expect, it } from 'vitest'
import { normalizeTopicName, topicNameSchema } from '../src/topics/names.js'

describe('nama bulat', () => {
  it('menganggap nama sama jika beda huruf besar dan spasi di tepi', () => {
    expect(normalizeTopicName('  Persamaan Linear ')).toBe(normalizeTopicName('persamaan linear'))
  })

  it('menolak nama kosong dan lebih dari 60 karakter', () => {
    expect(topicNameSchema.safeParse('   ').success).toBe(false)
    expect(topicNameSchema.safeParse('a'.repeat(61)).success).toBe(false)
    expect(topicNameSchema.safeParse('a'.repeat(60)).success).toBe(true)
  })
})
