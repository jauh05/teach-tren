// @vitest-environment node
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { colors } from './tokens'

// The mockup stylesheet (docs/design/html/styles.css) is the visual source of truth.
const css = readFileSync(new URL('../../../docs/design/html/styles.css', import.meta.url), 'utf8')

function cssVar(name: string): string {
  const match = css.match(new RegExp(`--${name}:(#[0-9A-Fa-f]{6})`))
  if (!match) {
    throw new Error(`Variabel --${name} tidak ditemukan di styles.css`)
  }
  return match[1].toUpperCase()
}

describe('token warna sama dengan styles.css mockup', () => {
  it('warna brand, teks, dan garis', () => {
    expect(colors.brand.DEFAULT).toBe(cssVar('brand'))
    expect(colors.brand.dark).toBe(cssVar('brand-d'))
    expect(colors.brand.soft).toBe(cssVar('soft'))
    expect(colors.ink).toBe(cssVar('ink'))
    expect(colors.muted).toBe(cssVar('muted'))
    expect(colors.line).toBe(cssVar('line'))
    expect(colors.canvas).toBe(cssVar('canvas'))
  })

  it('warna status bulat', () => {
    expect(colors.status.kuasai).toBe(cssVar('ok'))
    expect(colors.status.sedang).toBe(cssVar('warn'))
    expect(colors.status.ulang).toBe(cssVar('bad'))
    expect(colors.status.baru).toBe(cssVar('teal'))
    expect(colors.status.belum).toBe(cssVar('slate'))
    expect(colors.status.saran).toBe(cssVar('violet'))
  })
})
