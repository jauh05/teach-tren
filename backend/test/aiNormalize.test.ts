import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { fixBackslashes, normalizeModelJson, parseModelOutput } from '../src/ai/normalize.js'

// Fixtures of model output that the normalizer must read (docs/role.md CC-06).
const schema = z.object({ langkah: z.array(z.string()), rumus: z.string() })

describe('normalisasi keluaran model', () => {
  it('membuang pagar markdown', () => {
    const raw = '```json\n{"langkah":["satu","dua"],"rumus":"x = 2"}\n```'
    expect(parseModelOutput(raw, schema)).toEqual({ ok: true, value: { langkah: ['satu', 'dua'], rumus: 'x = 2' } })
  })

  it('mengambil objek pertama saat ada teks di sekitarnya', () => {
    const raw = 'Berikut hasilnya: {"langkah":["satu"],"rumus":"y"} semoga membantu. {"abaikan":1}'
    expect(parseModelOutput(raw, schema)).toEqual({ ok: true, value: { langkah: ['satu'], rumus: 'y' } })
  })

  it('memperbaiki backslash LaTeX yang belum ditulis ganda', () => {
    const raw = '{"langkah":["hitung \\frac{1}{2}"],"rumus":"$\\times$ dan $\\neq$ dan $\\text{m}$"}'
    const value = normalizeModelJson(raw) as { langkah: string[]; rumus: string }
    expect(value.langkah[0]).toBe('hitung \\frac{1}{2}')
    expect(value.rumus).toBe('$\\times$ dan $\\neq$ dan $\\text{m}$')
  })

  it('tidak menggandakan backslash yang sudah benar', () => {
    const raw = '{"langkah":["\\\\frac{1}{2}"],"rumus":"baris\\nbaru dan \\u00e9"}'
    const value = normalizeModelJson(raw) as { langkah: string[]; rumus: string }
    expect(value.langkah[0]).toBe('\\frac{1}{2}')
    expect(value.rumus).toBe('baris\nbaru dan \u00e9')
  })

  it('menghapus koma berlebih sebelum kurung tutup', () => {
    const raw = '{"langkah":["satu","dua",],"rumus":"z",}'
    expect(parseModelOutput(raw, schema)).toEqual({ ok: true, value: { langkah: ['satu', 'dua'], rumus: 'z' } })
  })

  it('kunci yang salah ditolak dengan pesan yang bisa dipakai untuk perbaikan', () => {
    const result = parseModelOutput('{"langkah":"bukan larik","rumus":"z"}', schema)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toContain('langkah')
    }
  })

  it('teks tanpa JSON sama sekali ditolak', () => {
    expect(parseModelOutput('Maaf, saya tidak bisa menjawab.', schema).ok).toBe(false)
  })

  it('fixBackslashes membiarkan escape JSON dan menggandakan sisanya', () => {
    expect(fixBackslashes('\\n\\t\\"\\\\\\/')).toBe('\\n\\t\\"\\\\\\/')
    expect(fixBackslashes('\\frac \\{ \\,')).toBe('\\\\frac \\\\{ \\\\,')
  })
})
