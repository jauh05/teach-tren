import { describe, expect, it } from 'vitest'
import { safeRedirect, signInSchema, signUpSchema } from './auth'

describe('signInSchema', () => {
  it('menerima email dan kata sandi yang valid', () => {
    expect(signInSchema.safeParse({ email: 'rafi@contoh.id', password: 'rahasia123' }).success).toBe(true)
  })

  it('menolak email tidak valid dan kata sandi pendek', () => {
    expect(signInSchema.safeParse({ email: 'bukan-email', password: 'rahasia123' }).success).toBe(false)
    expect(signInSchema.safeParse({ email: 'rafi@contoh.id', password: 'pendek' }).success).toBe(false)
  })
})

describe('signUpSchema', () => {
  it('mewajibkan nama minimal dua karakter', () => {
    expect(signUpSchema.safeParse({ name: 'R', email: 'rafi@contoh.id', password: 'rahasia123' }).success).toBe(false)
  })
})

describe('safeRedirect', () => {
  it('mengizinkan path di dalam aplikasi', () => {
    expect(safeRedirect('/jadwal')).toBe('/jadwal')
  })

  it.each([null, '', 'https://contoh.id', '//contoh.id', 'jadwal'])('menolak %j dan kembali ke /chat', (value) => {
    expect(safeRedirect(value)).toBe('/chat')
  })
})
