import { describe, expect, it } from 'vitest'
import { GUEST_ACTION_LIMIT, guestQuotaText, isGuestLimitReached, remainingGuestActions } from './guestQuota'

describe('kuota tamu', () => {
  it('batas aksi adalah dua aksi per perangkat', () => {
    expect(GUEST_ACTION_LIMIT).toBe(2)
  })

  it('menghitung sisa aksi dan tidak pernah negatif', () => {
    expect(remainingGuestActions(0)).toBe(2)
    expect(remainingGuestActions(1)).toBe(1)
    expect(remainingGuestActions(5)).toBe(0)
  })

  it('kuota habis tepat saat aksi kedua dipakai', () => {
    expect(isGuestLimitReached(1)).toBe(false)
    expect(isGuestLimitReached(2)).toBe(true)
  })

  it('teks header sesuai kondisi kuota', () => {
    expect(guestQuotaText(0)).toBe('sisa 2 dari 2 aksi')
    expect(guestQuotaText(1)).toBe('sisa 1 dari 2 aksi')
    expect(guestQuotaText(2)).toBe('2 dari 2 aksi terpakai')
  })
})
