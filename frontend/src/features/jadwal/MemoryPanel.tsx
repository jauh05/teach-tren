import { TOPIC_STATUS_LABEL } from '../../domain/topicStatus'
import type { MemoryEntry } from '../../domain/types'
import { formatShortDate, parseDateKey } from '../../domain/week'

interface MemoryPanelProps {
  entries: MemoryEntry[]
  locked: boolean
}

// Desktop: a fixed column on the right of the schedule (docs/role.md CC-08, 200px wide).
export function MemoryPanel({ entries, locked }: MemoryPanelProps) {
  return (
    <aside
      aria-label="Ingatan AI"
      className="hidden w-memory-panel shrink-0 flex-col overflow-y-auto border-l border-line bg-canvas p-3.5 md:flex"
    >
      <MemoryContent entries={entries} locked={locked} />
    </aside>
  )
}

interface MemoryContentProps {
  entries: MemoryEntry[]
  locked: boolean
}

// Shared by the desktop panel and the mobile page.
export function MemoryContent({ entries, locked }: MemoryContentProps) {
  return (
    <div className="flex flex-col gap-2">
      <h2 className="font-heading text-sm font-semibold text-ink">Ingatan AI</h2>
      {locked ? (
        <p className="text-xs text-muted">Ingatan AI tersedia setelah masuk.</p>
      ) : (
        <>
          <p className="text-xs text-muted">Topik yang pernah kamu pelajari. AI memakai ini untuk menyusun jadwal.</p>
          <ul className="flex flex-col gap-1.5">
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
        </>
      )}
    </div>
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
