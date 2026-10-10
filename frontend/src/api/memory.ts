import type { MemoryEntry } from '../domain/types'

// Mock memory until the backend exists. Dates match the mockup (docs/design/html/05-jadwal-desktop.html).
const SEED: MemoryEntry[] = [
  { id: 'bilangan', topicName: 'Bilangan', status: 'DIKUASAI', lastScore: 90, date: '2026-10-02' },
  { id: 'bangun-datar', topicName: 'Bangun datar', status: 'DIKUASAI', lastScore: 85, date: '2026-10-04' },
  { id: 'persamaan-linear', topicName: 'Persamaan linear', status: 'SEDANG', lastScore: 72, date: '2026-10-09' },
  { id: 'sel-tumbuhan', topicName: 'Sel tumbuhan', status: 'PERLU_DIULANG', lastScore: 38, date: '2026-10-10' },
]

export async function fetchMemory(): Promise<MemoryEntry[]> {
  return structuredClone(SEED)
}
