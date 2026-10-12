import { useQuery } from '@tanstack/react-query'
import { ChevronLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import { fetchMemory } from '../../api/memory'
import { useSessionStore } from '../../stores/sessionStore'
import { MemoryDiagramBlock, MemoryIntro, MemoryList } from './MemoryPanel'

// Learning memory page (/jadwal/ingatan). On phones it is one column: intro, diagram, then the list.
// On desktop the diagram is large on the left, and the list sits on the right.
export function MemoryPage() {
  const isGuest = useSessionStore((state) => state.mode === 'guest')
  const { data = [] } = useQuery({
    queryKey: ['memory'],
    queryFn: fetchMemory,
    enabled: !isGuest,
  })

  return (
    <section className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-4 py-4 md:px-8 md:py-6">
      <Link to="/jadwal" className="inline-flex min-h-[44px] items-center gap-1 self-start text-sm font-semibold text-brand-dark">
        <ChevronLeft size={16} aria-hidden="true" />
        Jadwal
      </Link>
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
    </section>
  )
}
