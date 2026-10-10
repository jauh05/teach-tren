import { placeItem, type ScheduleItem, type ScheduleKind, type ScheduleTone } from '../domain/schedule'
import { addDays, dateKey, startOfWeek } from '../domain/week'

// Mock schedule until the backend exists. Items are placed relative to the current week,
// so the mock stays visible whatever the date is.
interface SeedItem {
  dayIndex: number
  title: string
  kind: ScheduleKind
  tone: ScheduleTone
  reason: string
}

const SEED: SeedItem[] = [
  { dayIndex: 0, title: 'Pertidaksamaan', kind: 'SARAN', tone: 'suggested', reason: 'Saran AI dari topik Bangun datar' },
  { dayIndex: 1, title: 'Ulangi Sel tumbuhan', kind: 'ULANG', tone: 'review', reason: 'Karena skor 38 pada Sel tumbuhan' },
  { dayIndex: 2, title: 'Latihan Persamaan linear', kind: 'LATIHAN', tone: 'learning', reason: 'Skor 72 pada Persamaan linear' },
  { dayIndex: 3, title: 'Grafik fungsi', kind: 'SARAN', tone: 'suggested', reason: 'Saran AI dari topik Fungsi kuadrat' },
  { dayIndex: 4, title: 'Tinjau Bangun datar', kind: 'LATIHAN', tone: 'mastered', reason: 'Sudah dikuasai, tinjau ulang' },
  { dayIndex: 5, title: 'Istirahat', kind: 'ISTIRAHAT', tone: 'rest', reason: 'Tidak ada jadwal' },
  { dayIndex: 6, title: 'Kuis campuran', kind: 'SARAN', tone: 'suggested', reason: '5 soal, saran AI' },
]

let items: ScheduleItem[] | null = null

function ensureItems(now: Date): ScheduleItem[] {
  if (items === null) {
    const monday = startOfWeek(now)
    items = SEED.map((seed, index) => ({
      id: `item-${index}`,
      date: dateKey(addDays(monday, seed.dayIndex)),
      title: seed.title,
      kind: seed.kind,
      tone: seed.tone,
      reason: seed.reason,
    }))
  }
  return items
}

export async function fetchSchedule(now: Date = new Date()): Promise<ScheduleItem[]> {
  return structuredClone(ensureItems(now))
}

// Used for both accepting a suggestion and moving an item to another day.
export async function placeScheduleItem(itemId: string, date: string): Promise<void> {
  const current = ensureItems(new Date())
  items = current.map((item) => (item.id === itemId ? placeItem(item, date) : item))
}
