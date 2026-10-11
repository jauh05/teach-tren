import { z } from 'zod'
import { type ScheduleItem, type ScheduleKind, type ScheduleTone } from '../domain/schedule'
import { useSessionStore } from '../stores/sessionStore'
import { apiRequest } from './http'

// Signed-in users read and change their schedule through the backend. Guests get an empty, read-only calendar.
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

const SIGN_IN_TO_EDIT = 'Masuk untuk mengatur jadwal belajar.'

export async function fetchSchedule(): Promise<ScheduleItem[]> {
  if (useSessionStore.getState().mode !== 'signedIn') {
    return []
  }
  const data = z.object({ items: z.array(itemSchema) }).parse(await apiRequest('GET', '/api/jadwal'))
  return data.items.map((item) => ({ ...item, tone: TONE_OF[item.kind] }))
}

// Used for both accepting a suggestion and moving an item to another day.
export async function placeScheduleItem(itemId: string, date: string): Promise<void> {
  if (useSessionStore.getState().mode !== 'signedIn') {
    throw new Error(SIGN_IN_TO_EDIT)
  }
  // The server accepts a suggestion when it is moved, so the same call covers both cases.
  await apiRequest('PATCH', `/api/jadwal/item/${encodeURIComponent(itemId)}`, { date })
}
