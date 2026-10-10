import { useQuery } from '@tanstack/react-query'
import { ChevronLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import { fetchMemory } from '../../api/memory'
import { useSessionStore } from '../../stores/sessionStore'
import { MemoryContent } from './MemoryPanel'

// Mobile page for Ingatan AI (/jadwal/ingatan). On desktop the same content sits in the schedule panel.
export function MemoryPage() {
  const isGuest = useSessionStore((state) => state.mode === 'guest')
  const { data = [] } = useQuery({
    queryKey: ['memory'],
    queryFn: fetchMemory,
    enabled: !isGuest,
  })

  return (
    <section className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 py-4">
      <Link to="/jadwal" className="inline-flex min-h-[44px] items-center gap-1 self-start text-sm font-semibold text-brand-dark">
        <ChevronLeft size={16} aria-hidden="true" />
        Jadwal
      </Link>
      <MemoryContent entries={data} locked={isGuest} />
    </section>
  )
}
