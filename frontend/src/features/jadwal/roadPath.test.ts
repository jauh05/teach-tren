import { describe, expect, it } from 'vitest'
import { STEP_WIDTH, drawingWidthOf, roadPathOf, roadPointsOf, stopPoints } from './roadPath'

describe('gambar roadmap', () => {
  it('setiap langkah berada di kanan langkah sebelumnya, dengan jarak yang sama', () => {
    const stops = stopPoints(5)
    expect(stops).toHaveLength(5)
    for (let index = 1; index < stops.length; index++) {
      expect(stops[index].x - stops[index - 1].x).toBe(STEP_WIDTH)
    }
  })

  it('langkah bergantian antara lengkung atas dan bawah', () => {
    const stops = stopPoints(4)
    expect(stops[0].y).not.toBe(stops[1].y)
    expect(stops[0].y).toBe(stops[2].y)
  })

  it('lebar gambar bertambah sesuai jumlah langkah, sehingga roadmap bisa digeser ke samping', () => {
    expect(drawingWidthOf(6)).toBeGreaterThan(drawingWidthOf(3))
    const last = stopPoints(6).at(-1)
    expect(last).toBeDefined()
    expect(drawingWidthOf(6)).toBeGreaterThan(last?.x ?? 0)
  })

  it('jalur jalan dimulai dengan M dan memakai kurva C', () => {
    const path = roadPathOf(roadPointsOf(3))
    expect(path.startsWith('M ')).toBe(true)
    expect(path).toContain(' C ')
  })

  it('tanpa langkah jalur tetap ada, dan jalur dari satu titik kosong', () => {
    expect(roadPathOf([])).toBe('')
    expect(roadPointsOf(0)).toHaveLength(2)
  })
})
