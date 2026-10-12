import { describe, expect, it } from 'vitest'
import { labelBoxesOverlap, resolveLabelOverlaps, type LabelNode } from './labelLayout'

describe('labelBoxesOverlap', () => {
  it('menganggap dua neuron yang saling tumpuk sebagai bertabrakan', () => {
    const a: LabelNode = { x: 100, y: 100, radius: 30, name: 'Bilangan' }
    const b: LabelNode = { x: 110, y: 105, radius: 30, name: 'Bangun datar' }
    expect(labelBoxesOverlap(a, b)).toBe(true)
  })

  it('neuron yang berjauhan tidak bertabrakan', () => {
    const a: LabelNode = { x: 100, y: 100, radius: 30, name: 'Bilangan' }
    const b: LabelNode = { x: 400, y: 300, radius: 30, name: 'Sel tumbuhan' }
    expect(labelBoxesOverlap(a, b)).toBe(false)
  })
})

describe('resolveLabelOverlaps', () => {
  it('memisahkan neuron yang berada di posisi yang sama', () => {
    const nodes: LabelNode[] = [
      { x: 200, y: 200, radius: 30, name: 'Persamaan linear' },
      { x: 200, y: 200, radius: 30, name: 'Sel tumbuhan' },
      { x: 200, y: 200, radius: 38, name: 'Fungsi kuadrat' },
    ]

    resolveLabelOverlaps(nodes)

    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        expect(labelBoxesOverlap(nodes[i], nodes[j])).toBe(false)
      }
    }
  })

  it('tidak menggeser neuron yang sudah tidak bertabrakan', () => {
    const nodes: LabelNode[] = [
      { x: 0, y: 0, radius: 30, name: 'Bilangan' },
      { x: 400, y: 0, radius: 30, name: 'Sel tumbuhan' },
    ]

    resolveLabelOverlaps(nodes)

    expect(nodes[0]).toMatchObject({ x: 0, y: 0 })
    expect(nodes[1]).toMatchObject({ x: 400, y: 0 })
  })
})
