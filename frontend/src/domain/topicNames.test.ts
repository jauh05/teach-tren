import { describe, expect, it } from 'vitest'
import { topicNameFromQuestion, topicNameSchema } from './topicNames'

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

describe('topicNameFromQuestion', () => {
  it('membuang tanda tanya dan spasi berlebih', () => {
    expect(topicNameFromQuestion('  Apa   itu fotosintesis?  ')).toBe('Apa itu fotosintesis')
  })

  it('memotong pertanyaan panjang menjadi 60 karakter dengan elipsis', () => {
    const name = topicNameFromQuestion('a'.repeat(80))
    expect(name.length).toBe(60)
    expect(name.endsWith('…')).toBe(true)
  })

  it('mengembalikan kosong jika tidak ada huruf yang tersisa', () => {
    expect(topicNameFromQuestion(' ?! ')).toBe('')
  })
})
