import { describe, expect, it } from 'vitest'
import { initialsOf } from './format'

describe('initialsOf', () => {
  it.each([
    ['Rafi Arkan', 'RA'],
    ['Rafi', 'RA'],
    ['  siti   nurhaliza maharani ', 'SM'],
    ['', '?'],
    ['   ', '?'],
  ])('%j menjadi %s', (name, expected) => {
    expect(initialsOf(name)).toBe(expected)
  })
})
