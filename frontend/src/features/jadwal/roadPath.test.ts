import { describe, expect, it } from 'vitest'
import { ROAD_VIEW, roadCenterAt, roadPath, stopsOf } from './roadPath'

describe('gambar roadmap', () => {
  it('jalan dimulai di atas dan berakhir di bawah, dan tetap di dalam kanvas', () => {
    expect(roadCenterAt(0).y).toBeLessThan(roadCenterAt(1).y)
    for (let index = 0; index <= 20; index++) {
      const point = roadCenterAt(index / 20)
      expect(point.x).toBeGreaterThan(0)
      expect(point.x).toBeLessThan(ROAD_VIEW.width)
    }
  })

  it('jalur jalan dimulai dengan M dan berisi titik-titik L', () => {
    const path = roadPath(10)
    expect(path.startsWith('M ')).toBe(true)
    // Eleven points (0 to 10) make one M and ten L segments, which split into eleven parts.
    expect(path.split(' L ')).toHaveLength(11)
  })

  it('pemberhentian tersebar dari atas ke bawah dan berselang-seling kiri dan kanan', () => {
    const stops = stopsOf(5)
    expect(stops).toHaveLength(5)
    for (let index = 1; index < stops.length; index++) {
      expect(stops[index].y).toBeGreaterThan(stops[index - 1].y)
      expect(stops[index].side).not.toBe(stops[index - 1].side)
    }
  })

  it('satu pemberhentian diletakkan di tengah jalan', () => {
    const [stop] = stopsOf(1)
    expect(stop.y).toBeCloseTo((roadCenterAt(0).y + roadCenterAt(1).y) / 2, 5)
  })

  it('tanpa pemberhentian hasilnya kosong', () => {
    expect(stopsOf(0)).toEqual([])
  })
})
