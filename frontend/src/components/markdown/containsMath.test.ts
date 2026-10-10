import { describe, expect, it } from 'vitest'
import { containsMath } from './containsMath'

describe('containsMath', () => {
  it.each([
    ['Harga satu buku adalah $x$ rupiah.', true],
    ['Hasil $$x = 4$$', true],
    ['Sel tumbuhan memiliki dinding sel.', false],
    ['', false],
  ])('%j', (text, expected) => {
    expect(containsMath(text)).toBe(expected)
  })
})
