import { describe, expect, it } from 'vitest'
import { loadConfig } from '../src/config/env.js'

const BASE = { DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/teach_tren_test', JWT_SECRET: 'rahasia-uji-minimal-32-karakter-untuk-test' }

describe('konfigurasi AI', () => {
  it('di produksi AI_MODE wajib diisi, karena nilai kosong akan menjawab dengan keluaran tiruan', () => {
    expect(() => loadConfig({ ...BASE, NODE_ENV: 'production' })).toThrow('AI_MODE wajib diisi')
  })

  it('di produksi mock boleh dipilih, tetapi harus disebut secara eksplisit', () => {
    expect(loadConfig({ ...BASE, NODE_ENV: 'production', AI_MODE: 'mock' }).AI_MODE).toBe('mock')
  })

  it('di pengembangan AI_MODE memakai mock jika tidak diisi', () => {
    expect(loadConfig({ ...BASE, NODE_ENV: 'development' }).AI_MODE).toBe('mock')
  })

  it('live tanpa kunci OpenRouter ditolak saat start', () => {
    expect(() => loadConfig({ ...BASE, AI_MODE: 'live' })).toThrow('OPENROUTER_API_KEY')
  })

  it('batas token kuis default 7000, sesuai persetujuan (docs/selisih.md baris 96)', () => {
    expect(loadConfig({ ...BASE }).AI_MAX_TOKENS_KUIS).toBe(7000)
  })
})
