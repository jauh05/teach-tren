// Calendar helpers in local time, the same as the browser, so both sides agree on "this week".

export function dateKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days)
}

// Monday 00:00 of the week that contains the date.
export function startOfWeek(date: Date): Date {
  const day = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  return addDays(day, -((day.getDay() + 6) % 7))
}

export const WEEKDAY_ORDER = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'] as const

// Date of a weekday name ("Senin" to "Minggu") in the week that contains "now".
export function dateOfWeekday(weekday: (typeof WEEKDAY_ORDER)[number], now: Date): string {
  return dateKey(addDays(startOfWeek(now), WEEKDAY_ORDER.indexOf(weekday)))
}

export const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/
