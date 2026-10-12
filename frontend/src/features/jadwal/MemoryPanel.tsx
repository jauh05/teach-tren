import { MemoryDiagram, SAMPLE_MEMORY_NODES, type MemoryNode } from '../../components/illustrations/MemoryDiagram'
import { TOPIC_STATUS_LABEL } from '../../domain/topicStatus'
import type { MemoryEntry } from '../../domain/types'
import { formatShortDate, parseDateKey } from '../../domain/week'

interface MemoryPanelProps {
  entries: MemoryEntry[]
  locked: boolean
}

// Desktop: a column on the right of the schedule. The diagram needs room, so the column is wider than the old list.
export function MemoryPanel({ entries, locked }: MemoryPanelProps) {
  return (
    <aside
      aria-label="Learning memory"
      className="hidden w-memory-panel shrink-0 flex-col gap-4 overflow-y-auto border-l border-line bg-canvas p-4 md:flex"
    >
      <MemoryIntro locked={locked} />
      <MemoryDiagramBlock entries={entries} locked={locked} />
      <MemoryList entries={entries} locked={locked} />
    </aside>
  )
}

// What the memory is. The explanation matches the tour.
export function MemoryIntro({ locked }: { locked: boolean }) {
  return (
    <div className="flex flex-col gap-1.5">
      <h2 className="font-heading text-lg font-semibold text-ink">Learning memory</h2>
      <p className="text-xs leading-5 text-muted">
        {locked
          ? 'Learning memory tersedia setelah masuk.'
          : 'Learning memory mengenali pola belajarmu dan memahaminya. Setiap neuron adalah topik yang kamu pelajari.'}
      </p>
    </div>
  )
}

// The neurons of the user's memory. Guests, and accounts with no studied topics yet, see the sample so the diagram is never empty.
// Each neuron has the color of its status.
export function memoryNodesOf(entries: MemoryEntry[], locked: boolean): MemoryNode[] {
  if (locked || entries.length === 0) {
    return SAMPLE_MEMORY_NODES
  }
  return entries.map((entry) => ({ name: entry.topicName, status: entry.status }))
}

export function MemoryDiagramBlock({ entries, locked }: { entries: MemoryEntry[]; locked: boolean }) {
  const caption = locked
    ? 'Contoh. Masuk untuk melihat pola belajarmu.'
    : entries.length === 0
      ? 'Contoh. Neuronmu akan terisi saat kamu mulai belajar.'
      : null
  return (
    <figure className="flex flex-col gap-2">
      <div className="aspect-square w-full">
        <MemoryDiagram nodes={memoryNodesOf(entries, locked)} />
      </div>
      {caption && <figcaption className="text-center text-xs text-muted">{caption}</figcaption>}
    </figure>
  )
}

// The topics as a list, with status and the last update. Guests see only the sample diagram.
export function MemoryList({ entries, locked }: { entries: MemoryEntry[]; locked: boolean }) {
  if (locked) {
    return null
  }
  return (
    <ul className="flex flex-col gap-1.5" aria-label="Topik yang sudah dipelajari">
      {entries.map((entry) => (
        <li key={entry.id} className="rounded-lg border border-line bg-white px-2.5 py-2 text-xs text-ink">
          <span className="font-semibold">{entry.topicName}</span>
          <span className="text-muted">
            {' '}
            · {memoryStatusText(entry)} · {formatShortDate(parseDateKey(entry.date))}
          </span>
        </li>
      ))}
    </ul>
  )
}

function memoryStatusText(entry: MemoryEntry): string {
  if (entry.status === 'DIKUASAI') {
    return 'dikuasai'
  }
  if (entry.lastScore !== null) {
    return `skor ${entry.lastScore}`
  }
  return TOPIC_STATUS_LABEL[entry.status].toLowerCase()
}
