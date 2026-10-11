import { z } from 'zod'
import type { MemoryEntry } from '../domain/types'
import { useSessionStore } from '../stores/sessionStore'
import { apiRequest } from './http'

const entrySchema = z.object({
  id: z.string(),
  topicName: z.string(),
  status: z.enum(['DIKUASAI', 'SEDANG', 'PERLU_DIULANG']),
  lastScore: z.number(),
  date: z.string(),
})

// Memory belongs to signed-in accounts. Guests get an empty list, and the panel is locked for them.
export async function fetchMemory(): Promise<MemoryEntry[]> {
  if (useSessionStore.getState().mode !== 'signedIn') {
    return []
  }
  return z.object({ entries: z.array(entrySchema) }).parse(await apiRequest('GET', '/api/memori')).entries
}
