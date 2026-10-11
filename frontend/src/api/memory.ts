import { z } from 'zod'
import type { MemoryEntry } from '../domain/types'
import { useSessionStore } from '../stores/sessionStore'
import { apiRequest } from './http'

// Memory of a signed-in user comes from the backend. Guests see the example entries below.
const SEED: MemoryEntry[] = [
  { id: 'bilangan', topicName: 'Bilangan', status: 'DIKUASAI', lastScore: 90, date: '2026-10-02' },
  { id: 'bangun-datar', topicName: 'Bangun datar', status: 'DIKUASAI', lastScore: 85, date: '2026-10-04' },
  { id: 'persamaan-linear', topicName: 'Persamaan linear', status: 'SEDANG', lastScore: 72, date: '2026-10-09' },
  { id: 'sel-tumbuhan', topicName: 'Sel tumbuhan', status: 'PERLU_DIULANG', lastScore: 38, date: '2026-10-10' },
]

const entrySchema = z.object({
  id: z.string(),
  topicName: z.string(),
  status: z.enum(['DIKUASAI', 'SEDANG', 'PERLU_DIULANG']),
  lastScore: z.number(),
  date: z.string(),
})

export async function fetchMemory(): Promise<MemoryEntry[]> {
  if (useSessionStore.getState().mode === 'signedIn') {
    return z.object({ entries: z.array(entrySchema) }).parse(await apiRequest('GET', '/api/memori')).entries
  }
  return structuredClone(SEED)
}
