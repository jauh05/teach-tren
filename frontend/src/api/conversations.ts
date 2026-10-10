import type { Conversation } from '../domain/types'

// Mock data until the backend exists. Replace this module with real requests later.
interface SeedConversation {
  id: string
  title: string
  daysAgo: number
}

const SEED: SeedConversation[] = [
  { id: 'persamaan-linear', title: 'Persamaan linear', daysAgo: 0 },
  { id: 'sel-tumbuhan', title: 'Sel tumbuhan', daysAgo: 0 },
  { id: 'proklamasi-kemerdekaan', title: 'Proklamasi kemerdekaan', daysAgo: 1 },
  { id: 'bangun-datar', title: 'Bangun datar', daysAgo: 4 },
  { id: 'hukum-newton', title: 'Hukum Newton', daysAgo: 20 },
]

const DAY_MS = 24 * 60 * 60 * 1000
const MINUTE_MS = 60 * 1000

export async function fetchConversations(now: Date = new Date()): Promise<Conversation[]> {
  return SEED.map((item, index) => ({
    id: item.id,
    title: item.title,
    // Small offsets keep the order stable between items on the same day.
    updatedAt: new Date(now.getTime() - item.daysAgo * DAY_MS - index * MINUTE_MS).toISOString(),
  }))
}
