import { describe, expect, it } from 'vitest'
import { isTopicNameTaken, topicNameSchema } from './topicNames'

const topics = [
  { id: 'persamaan-linear', name: 'Persamaan linear' },
  { id: 'bilangan', name: 'Bilangan' },
]

describe('isTopicNameTaken', () => {
  it('menolak nama yang sama dengan bulat lain tanpa memperhatikan huruf besar kecil', () => {
    expect(isTopicNameTaken(topics, 'BILANGAN', 'persamaan-linear')).toBe(true)
  })

  it('mengabaikan spasi di awal dan akhir', () => {
    expect(isTopicNameTaken(topics, '  Bilangan  ', 'persamaan-linear')).toBe(true)
  })

  it('mengizinkan nama lama milik bulat itu sendiri', () => {
    expect(isTopicNameTaken(topics, 'Bilangan', 'bilangan')).toBe(false)
  })

  it('mengizinkan nama yang belum dipakai', () => {
    expect(isTopicNameTaken(topics, 'Bangun datar', 'persamaan-linear')).toBe(false)
  })
})

describe('topicNameSchema', () => {
  it('menolak nama kosong dan nama yang terlalu panjang', () => {
    expect(topicNameSchema.safeParse('   ').success).toBe(false)
    expect(topicNameSchema.safeParse('a'.repeat(61)).success).toBe(false)
  })

  it('menerima nama biasa dan memotong spasi', () => {
    const result = topicNameSchema.safeParse('  Sel tumbuhan ')
    expect(result.success && result.data).toBe('Sel tumbuhan')
  })
})
