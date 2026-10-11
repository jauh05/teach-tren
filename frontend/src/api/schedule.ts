import { z } from 'zod'
import { placeItem, type ScheduleItem, type ScheduleKind, type ScheduleTone } from '../domain/schedule'
import { addDays, dateKey, startOfWeek } from '../domain/week'
import { useSessionStore } from '../stores/sessionStore'
import { apiRequest } from './http'

// Signed-in users read and change their schedule through the backend. Guests see the example schedule below, read-only.
const itemSchema = z.object({
  id: z.string(),
  date: z.string(),
  title: z.string(),
  kind: z.enum(['LATIHAN', 'ULANG', 'BARU', 'SARAN', 'ISTIRAHAT', 'DIKUASAI']),
  reason: z.string(),
})

const TONE_OF: Record<ScheduleKind, ScheduleTone> = {
  LATIHAN: 'learning',
  ULANG: 'review',
  BARU: 'learning',
  SARAN: 'suggested',
  ISTIRAHAT: 'rest',
  DIKUASAI: 'mastered',
}

function usesServer(): boolean {
  return useSessionStore.getState().mode === 'signedIn'
}

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
  if (usesServer()) {
    const data = z.object({ items: z.array(itemSchema) }).parse(await apiRequest('GET', '/api/jadwal'))
    return data.items.map((item) => ({ ...item, tone: TONE_OF[item.kind] }))
  }
  return structuredClone(ensureItems(now))
}

// Used for both accepting a suggestion and moving an item to another day.
export async function placeScheduleItem(itemId: string, date: string): Promise<void> {
  if (usesServer()) {
    // The server accepts a suggestion when it is moved, so the same call covers both cases.
    await apiRequest('PATCH', `/api/jadwal/item/${encodeURIComponent(itemId)}`, { date })
    return
  }
  const current = ensureItems(new Date())
  items = current.map((item) => (item.id === itemId ? placeItem(item, date) : item))
}
