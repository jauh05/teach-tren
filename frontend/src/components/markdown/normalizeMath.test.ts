import { describe, expect, it } from 'vitest'
import { normalizeMath } from './normalizeMath'

describe('normalizeMath', () => {
  it('rumus tanpa tanda dolar dibungkus dolar, dan titik di akhir tetap di luar', () => {
    expect(normalizeMath('P(X=0) = e^{-λ}·λ^0/0! = e^{-5} ≈ 0,0067.')).toBe('$P(X=0) = e^{-λ}·λ^0/0! = e^{-5} ≈ 0,0067$.')
  })

  it('perintah LaTeX di dalam daftar tetap berada setelah penanda daftar', () => {
    expect(normalizeMath('1. \\frac{1}{2} + \\frac{1}{4}')).toBe('1. $\\frac{1}{2} + \\frac{1}{4}$')
  })

  it('\\( \\) dan \\[ \\] diubah menjadi dolar', () => {
    expect(normalizeMath('Nilainya \\(x = 2\\).')).toBe('Nilainya $x = 2$.')
    expect(normalizeMath('\\[\\sum_{i=1}^{n} i\\]')).toBe('$$\\sum_{i=1}^{n} i$$')
  })

  it('kalimat biasa dan rumus yang sudah memakai dolar tidak diubah', () => {
    expect(normalizeMath('Jawab dengan teliti.')).toBe('Jawab dengan teliti.')
    expect(normalizeMath('Rumusnya $v = s/t$ dan $x^{2}$.')).toBe('Rumusnya $v = s/t$ dan $x^{2}$.')
  })

  it('blok kode tidak diubah', () => {
    const code = '```\nx^{2} + \\frac{1}{2}\n```'
    expect(normalizeMath(code)).toBe(code)
  })
})
