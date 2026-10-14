import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, Route } from 'lucide-react'
import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { fetchMemory } from '../../api/memory'
import { SAMPLE_MEMORY_NODES } from '../../components/illustrations/MemoryDiagram'
import { TOPIC_STATUS_LABEL } from '../../domain/topicStatus'
import { useSessionStore } from '../../stores/sessionStore'
import { MemoryDiagramBlock, MemoryIntro, MemoryList } from './MemoryPanel'
import { MemoryRoadBoard } from './MemoryRoadBoard'
import type { RoadStep } from './RoadmapCard'

// Learning memory page (/jadwal/ingatan). On phones it is one column: intro, diagram, then the list.
// On desktop the diagram is large on the left, and the list sits on the right.
// The Roadmap button puts the roadmap next to the diagram, on one board where both cards can be dragged.
export function MemoryPage() {
  const isGuest = useSessionStore((state) => state.mode === 'guest')
  // ?roadmap=1 opens the board straight away. The Learning page links here that way.
  const [params] = useSearchParams()
  const [showRoad, setShowRoad] = useState(params.get('roadmap') === '1')
  const { data = [] } = useQuery({
    queryKey: ['memory'],
    queryFn: fetchMemory,
    enabled: !isGuest,
  })
  // Guests and accounts without studied topics see the sample steps, the same as the sample diagram.
  const steps: RoadStep[] =
    isGuest || data.length === 0
      ? SAMPLE_MEMORY_NODES.map((node, index) => ({ id: `contoh-${index}`, title: node.name, detail: TOPIC_STATUS_LABEL[node.status] }))
      : data.map((entry) => ({ id: entry.id, title: entry.topicName, detail: TOPIC_STATUS_LABEL[entry.status] }))

  return (
    <section className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-4 py-4 md:px-8 md:py-6">
      <div className="flex items-center justify-between gap-3">
        <Link to="/jadwal" className="inline-flex min-h-[44px] items-center gap-1 self-start text-sm font-semibold text-brand-dark">
          <ChevronLeft size={16} aria-hidden="true" />
          Jadwal
        </Link>
        <button
          type="button"
          aria-pressed={showRoad}
          onClick={() => setShowRoad((value) => !value)}
          className="inline-flex min-h-[40px] items-center gap-2 rounded-full border border-line bg-white px-4 text-sm font-semibold text-ink hover:border-brand-dark"
        >
          <Route size={16} aria-hidden="true" />
          {showRoad ? 'Tutup roadmap' : 'Roadmap'}
        </button>
      </div>
      {showRoad ? (
        <MemoryRoadBoard memory={<MemoryDiagramBlock entries={data} locked={isGuest} />} steps={steps} />
      ) : (
      <div className="flex flex-col gap-5 md:grid md:grid-cols-[minmax(0,1fr)_360px] md:items-start md:gap-10">
        <div className="flex flex-col gap-4">
          <MemoryIntro locked={isGuest} />
          <div className="mx-auto w-full max-w-[420px] md:max-w-[520px]">
            <MemoryDiagramBlock entries={data} locked={isGuest} />
          </div>
        </div>
        {!isGuest && (
          <div className="flex flex-col gap-3">
            <h2 className="font-heading text-sm font-semibold text-ink md:text-base">Topik yang sudah dipelajari</h2>
            {data.length === 0 ? (
              <p className="text-sm text-muted">Belum ada topik. Topik akan muncul di sini setelah kamu mulai belajar di Learning.</p>
            ) : (
              <MemoryList entries={data} locked={isGuest} />
            )}
          </div>
        )}
      </div>
      )}
    </section>
  )
}
