// Calendar helpers for the schedule. Weeks run Monday to Sunday, in local time.

const MONTH_NAMES = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
]

const SHORT_MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']

const DAY_NAMES = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']

const SHORT_DAY_NAMES = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']

export function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days)
}

// Monday 00:00 of the week that contains the given date.
export function startOfWeek(date: Date): Date {
  const day = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const offsetFromMonday = (day.getDay() + 6) % 7
  return addDays(day, -offsetFromMonday)
}

export function weekDays(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, index) => addDays(weekStart, index))
}

// Stable key for a calendar day, YYYY-MM-DD. Used to match schedule items to days.
export function dateKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

// "12 sampai 18 Oktober", or "28 September sampai 4 Oktober" across two months.
export function formatWeekRange(weekStart: Date): string {
  const end = addDays(weekStart, 6)
  const startPart = weekStart.getMonth() === end.getMonth()
    ? `${weekStart.getDate()}`
    : `${weekStart.getDate()} ${MONTH_NAMES[weekStart.getMonth()]}`
  return `${startPart} sampai ${end.getDate()} ${MONTH_NAMES[end.getMonth()]}`
}

// "Minggu, 11 Oktober"
export function formatTodayLabel(date: Date): string {
  return `${DAY_NAMES[date.getDay()]}, ${date.getDate()} ${MONTH_NAMES[date.getMonth()]}`
}

// "2 Okt"
export function formatShortDate(date: Date): string {
  return `${date.getDate()} ${SHORT_MONTH_NAMES[date.getMonth()]}`
}

// "Sen", "Sel", ... "Min" (Monday first in the calendar, as in the mockup).
export function shortDayLabel(date: Date): string {
  return SHORT_DAY_NAMES[date.getDay()]
}

// Parses a YYYY-MM-DD key back into a local date.
export function parseDateKey(key: string): Date {
  const [year, month, day] = key.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

export function addMonths(date: Date, months: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + months, 1)
}

// Six full weeks, Monday first, that cover the month. Days outside the month are included.
export function monthGridDays(monthStart: Date): Date[] {
  const first = startOfWeek(monthStart)
  return Array.from({ length: 42 }, (_, index) => addDays(first, index))
}

// "Oktober 2026"
export function formatMonthLabel(date: Date): string {
  return `${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`
}
