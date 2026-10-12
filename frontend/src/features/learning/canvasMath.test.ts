import { describe, expect, it } from 'vitest'
import {
  MAX_ZOOM,
  MIN_ZOOM,
  centerView,
  fitView,
  clampZoom,
  neighborInDirection,
  screenToWorld,
  zoomAt,
  zoomPercent,
} from './canvasMath'

describe('clampZoom', () => {
  it('membatasi zoom 40 sampai 200 persen', () => {
    expect(clampZoom(0.1)).toBe(MIN_ZOOM)
    expect(clampZoom(5)).toBe(MAX_ZOOM)
    expect(clampZoom(1)).toBe(1)
  })
})

describe('zoomAt', () => {
  it('menjaga titik di bawah kursor tetap di tempatnya', () => {
    const view = { k: 1, x: 10, y: 20 }
    const anchor = { x: 100, y: 100 }
    const before = screenToWorld(view, anchor)

    const next = zoomAt(view, anchor, 2)
    const after = screenToWorld(next, anchor)

    expect(next.k).toBe(2)
    expect(after.x).toBeCloseTo(before.x)
    expect(after.y).toBeCloseTo(before.y)
  })

  it('tidak melewati batas zoom', () => {
    expect(zoomAt({ k: 1, x: 0, y: 0 }, { x: 0, y: 0 }, 10).k).toBe(MAX_ZOOM)
    expect(zoomAt({ k: 1, x: 0, y: 0 }, { x: 0, y: 0 }, 0.01).k).toBe(MIN_ZOOM)
  })
})

describe('centerView', () => {
  it('menempatkan titik tujuan di tengah kanvas', () => {
    const view = centerView(800, 600, { x: 300, y: 200 }, 1.5)
    const center = screenToWorld(view, { x: 400, y: 300 })
    expect(center.x).toBeCloseTo(300)
    expect(center.y).toBeCloseTo(200)
  })
})

describe('zoomPercent', () => {
  it('menampilkan persentase neuron', () => {
    expect(zoomPercent(0.4)).toBe(40)
    expect(zoomPercent(1)).toBe(100)
    expect(zoomPercent(1.25)).toBe(125)
  })
})

describe('neighborInDirection', () => {
  const positions = {
    a: { x: 100, y: 100 },
    b: { x: 200, y: 105 },
    c: { x: 100, y: 220 },
    d: { x: 300, y: 300 },
  }

  it('memilih neuron terdekat di arah kanan', () => {
    expect(neighborInDirection('a', 'right', positions)).toBe('b')
  })

  it('memilih neuron di bawah untuk arah bawah', () => {
    expect(neighborInDirection('a', 'down', positions)).toBe('c')
  })

  it('mengembalikan null jika tidak ada neuron di arah itu', () => {
    expect(neighborInDirection('d', 'right', positions)).toBeNull()
    expect(neighborInDirection('a', 'left', positions)).toBeNull()
  })
})

describe('fitView', () => {
  it('tidak memperbesar lebih dari 100 persen, dan tidak memperkecil kalau sudah muat', () => {
    const view = fitView(800, 600, [{ x: 100, y: 100 }, { x: 200, y: 150 }])
    expect(view.k).toBe(1)
  })

  it('memperkecil zoom kalau neuron tidak muat di kanvas ponsel, dan tidak di bawah batas minimum', () => {
    const wide = fitView(330, 300, [{ x: 0, y: 0 }, { x: 900, y: 0 }])
    expect(wide.k).toBeLessThan(1)
    expect(wide.k).toBeGreaterThanOrEqual(0.4)
    const huge = fitView(330, 300, [{ x: 0, y: 0 }, { x: 9000, y: 0 }])
    expect(huge.k).toBe(0.4)
  })
})

