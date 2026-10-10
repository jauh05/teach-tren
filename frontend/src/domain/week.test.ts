import { describe, expect, it } from 'vitest'
import {
  dateKey,
  formatShortDate,
  formatTodayLabel,
  formatWeekRange,
  parseDateKey,
  shortDayLabel,
  startOfWeek,
  weekDays,
} from './week'

// 11 October 2026 is a Sunday (the mockup's "Hari ini Minggu, 11 Oktober").
const SUNDAY = new Date(2026, 9, 11, 16, 30)

describe('startOfWeek', () => {
  it('memberi Senin 00:00 untuk hari Minggu', () => {
    expect(startOfWeek(SUNDAY)).toEqual(new Date(2026, 9, 5))
  })

  it('memberi tanggal yang sama untuk hari Senin', () => {
    expect(startOfWeek(new Date(2026, 9, 12, 9, 0))).toEqual(new Date(2026, 9, 12))
  })
})

describe('weekDays', () => {
  it('menghasilkan tujuh hari berurutan dengan Senin di awal', () => {
    const days = weekDays(new Date(2026, 9, 12))
    expect(days.map((day) => shortDayLabel(day))).toEqual(['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'])
  })
})

describe('formatWeekRange', () => {
  it('menulis rentang dalam satu bulan', () => {
    expect(formatWeekRange(new Date(2026, 9, 12))).toBe('12 sampai 18 Oktober')
  })

  it('menulis rentang yang melewati dua bulan', () => {
    expect(formatWeekRange(new Date(2026, 8, 28))).toBe('28 September sampai 4 Oktober')
  })
})

describe('label tanggal', () => {
  it('formatTodayLabel menulis hari dan tanggal lengkap', () => {
    expect(formatTodayLabel(SUNDAY)).toBe('Minggu, 11 Oktober')
  })

  it('formatShortDate menulis tanggal singkat', () => {
    expect(formatShortDate(new Date(2026, 9, 2))).toBe('2 Okt')
  })
})

describe('dateKey dan parseDateKey', () => {
  it('membuat kunci YYYY-MM-DD dengan nol di depan', () => {
    expect(dateKey(new Date(2026, 0, 5))).toBe('2026-01-05')
  })

  it('mengembalikan kunci ke tanggal lokal yang sama', () => {
    expect(parseDateKey('2026-10-14')).toEqual(new Date(2026, 9, 14))
  })
})
