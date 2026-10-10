import { describe, expect, it } from 'vitest'
import { isClearHistoryConfirmed, passwordChangeSchema, profileSchema } from './settings'

describe('profileSchema', () => {
  it('menerima nama dan memangkas spasi', () => {
    const result = profileSchema.safeParse({ name: '  Rafi Arkan ' })
    expect(result.success && result.data.name).toBe('Rafi Arkan')
  })

  it('menolak nama terlalu pendek', () => {
    expect(profileSchema.safeParse({ name: 'R' }).success).toBe(false)
  })
})

describe('passwordChangeSchema', () => {
  it('menolak konfirmasi yang tidak sama', () => {
    const result = passwordChangeSchema.safeParse({
      currentPassword: 'lama12345',
      newPassword: 'baru12345',
      confirmPassword: 'beda12345',
    })
    expect(result.success).toBe(false)
  })

  it('menerima kata sandi baru yang cocok dan cukup panjang', () => {
    const result = passwordChangeSchema.safeParse({
      currentPassword: 'lama12345',
      newPassword: 'baru12345',
      confirmPassword: 'baru12345',
    })
    expect(result.success).toBe(true)
  })
})

describe('isClearHistoryConfirmed', () => {
  it('hanya menerima kata HAPUS', () => {
    expect(isClearHistoryConfirmed('HAPUS')).toBe(true)
    expect(isClearHistoryConfirmed(' HAPUS ')).toBe(true)
    expect(isClearHistoryConfirmed('hapus')).toBe(false)
    expect(isClearHistoryConfirmed('')).toBe(false)
  })
})
