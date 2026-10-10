import { describe, expect, it } from 'vitest'
import { wrapLabel } from './wrapLabel'

describe('wrapLabel', () => {
  it('menjaga nama pendek tetap satu baris', () => {
    expect(wrapLabel('Bilangan')).toEqual(['Bilangan'])
  })

  it('memecah nama panjang menjadi dua baris', () => {
    expect(wrapLabel('Persamaan linear')).toEqual(['Persamaan', 'linear'])
  })

  it('memotong nama yang butuh lebih dari dua baris', () => {
    const lines = wrapLabel('Sistem persamaan linear dua variabel')
    expect(lines).toHaveLength(2)
    expect(lines[1].endsWith('…')).toBe(true)
  })

  it('mengembalikan daftar kosong untuk nama kosong', () => {
    expect(wrapLabel('   ')).toEqual([])
  })
})
