// @vitest-environment node
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { colors } from './tokens'

// docs/design/palet.md is the source of truth. The tokens must match it exactly.
const palette = readFileSync(new URL('../../../docs/design/palet.md', import.meta.url), 'utf8')

function documented(name: string): string {
  const match = palette.match(new RegExp(`^\\| ${name} \\| (#[0-9A-Fa-f]{6}) \\|`, 'm'))
  if (!match) {
    throw new Error(`Warna ${name} tidak ada di docs/design/palet.md`)
  }
  return match[1].toUpperCase()
}

// WCAG contrast ratio between two hex colors.
function luminance(hex: string): number {
  const channels = [1, 3, 5].map((index) => {
    const value = parseInt(hex.slice(index, index + 2), 16) / 255
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2]
}

function contrast(a: string, b: string): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (light + 0.05) / (dark + 0.05)
}

describe('token warna sama dengan docs/design/palet.md', () => {
  it('warna utama, teks, garis, dan latar', () => {
    expect(colors.brand.DEFAULT).toBe(documented('accent'))
    expect(colors.brand.dark).toBe(documented('accent-gelap'))
    expect(colors.brand.soft).toBe(documented('accent-lembut'))
    expect(colors.ink).toBe(documented('ink'))
    expect(colors.muted).toBe(documented('muted'))
    expect(colors.line).toBe(documented('line'))
    expect(colors.canvas).toBe(documented('canvas'))
  })

  it('warna status bulat', () => {
    expect(colors.status.kuasai).toBe(documented('kuasai'))
    expect(colors.status.sedang).toBe(documented('sedang'))
    expect(colors.status.ulang).toBe(documented('ulang'))
    expect(colors.status.baru).toBe(documented('baru'))
    expect(colors.status.belum).toBe(documented('belum'))
    expect(colors.status.saran).toBe(documented('saran'))
  })

  it('warna halaman masuk dan daftar', () => {
    expect(colors.auth.accent).toBe(documented('masuk-biru'))
    expect(colors.auth.accentDark).toBe(documented('masuk-biru-gelap'))
    expect(colors.auth.soft).toBe(documented('masuk-lembut'))
    expect(colors.auth.field).toBe(documented('masuk-kolom'))
    expect(colors.auth.placeholder).toBe(documented('masuk-placeholder'))
  })
})

describe('kontras teks memenuhi WCAG AA (minimal 4,5)', () => {
  const white = '#FFFFFF'
  it.each([
    ['teks utama di atas putih', colors.ink, white],
    ['teks sekunder di atas putih', colors.muted, white],
    ['teks hijau di atas putih', colors.brand.dark, white],
    ['teks utama di atas mint', colors.ink, colors.brand.soft],
    ['teks hijau di atas mint', colors.brand.dark, colors.brand.soft],
    ['teks putih di atas tombol hitam', white, colors.ink],
    ['teks sekunder di atas latar halaman', colors.muted, colors.canvas],
    ['teks putih di atas tombol biru masuk', white, colors.auth.accent],
    ['teks putih di atas biru gelap masuk', white, colors.auth.accentDark],
    ['teks petunjuk kolom masuk di atas putih', colors.auth.placeholder, white],
  ])('%s', (_name, foreground, background) => {
    expect(contrast(foreground, background)).toBeGreaterThanOrEqual(4.5)
  })
})
