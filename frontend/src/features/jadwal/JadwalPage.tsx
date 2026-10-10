import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchMemory } from '../../api/memory'
import { fetchSchedule, placeScheduleItem } from '../../api/schedule'
import { Button } from '../../components/ui/Button'
import { addDays, formatTodayLabel, formatWeekRange, startOfWeek, weekDays } from '../../domain/week'
import { useSessionStore } from '../../stores/sessionStore'
import { DayAgenda } from './DayAgenda'
import { MemoryPanel } from './MemoryPanel'
import { WeekGrid } from './WeekGrid'

// Schedule (/jadwal). Guests see the same schedule as a read-only example.
export function JadwalPage() {
  const isGuest = useSessionStore((state) => state.mode === 'guest')
  const queryClient = useQueryClient()
  const [today] = useState(() => new Date())
  const [weekStart, setWeekStart] = useState(() => startOfWeek(today))

  const schedule = useQuery({
    queryKey: ['schedule'],
    queryFn: () => fetchSchedule(),
  })
  const memory = useQuery({
    queryKey: ['memory'],
    queryFn: fetchMemory,
    enabled: !isGuest,
  })

  const place = useMutation({
    mutationFn: ({ itemId, date }: { itemId: string; date: string }) => placeScheduleItem(itemId, date),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['schedule'] }),
  })

  const canEdit = !isGuest
  const items = schedule.data ?? []
  const days = weekDays(weekStart)

  function placeItem(itemId: string, date: string) {
    if (canEdit) {
      place.mutate({ itemId, date })
    }
  }

  // Accepting keeps the suggestion on its current day. Only its kind changes.
  function acceptItem(itemId: string) {
    const item = items.find((current) => current.id === itemId)
    if (item) {
      placeItem(itemId, item.date)
    }
  }

  if (schedule.isPending) {
    return <p className="p-6 text-sm text-muted">Memuat jadwal...</p>
  }

  if (schedule.isError) {
    return (
      <p role="alert" className="p-6 text-sm text-red-700">
        Jadwal belum bisa dimuat. Coba muat ulang halaman.
      </p>
    )
  }

  return (
    <section className="flex min-h-0 flex-1">
      <div className="flex min-w-0 flex-1 flex-col gap-3 overflow-y-auto px-4 py-4 md:px-5">
        <header className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="font-heading text-base font-semibold text-ink">{formatWeekRange(weekStart)}</h1>
            <p className="text-xs text-muted">Hari ini {formatTodayLabel(today)}</p>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <Link
              to="/jadwal/ingatan"
              className="inline-flex min-h-[36px] items-center rounded-[10px] border border-[#CBD5E1] bg-white px-3 text-xs font-semibold text-ink md:hidden"
            >
              Ingatan AI
            </Link>
            <button
              type="button"
              aria-label="Minggu sebelumnya"
              onClick={() => setWeekStart((current) => addDays(current, -7))}
              className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-[#CBD5E1] bg-white text-ink"
            >
              <ChevronLeft size={16} aria-hidden="true" />
            </button>
            <Button variant="secondary" className="min-h-[36px]" onClick={() => setWeekStart(startOfWeek(new Date()))}>
              Hari ini
            </Button>
            <button
              type="button"
              aria-label="Minggu berikutnya"
              onClick={() => setWeekStart((current) => addDays(current, 7))}
              className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-[#CBD5E1] bg-white text-ink"
            >
              <ChevronRight size={16} aria-hidden="true" />
            </button>
          </div>
        </header>

        {isGuest && (
          <p className="rounded-xl border border-line bg-slate-50 px-3 py-2 text-sm text-ink">
            Ini contoh jadwal.{' '}
            <Link to="/masuk" className="font-semibold text-brand-dark underline">
              Masuk
            </Link>{' '}
            untuk menerima saran dan mengatur jadwal.
          </p>
        )}

        <WeekGrid
          days={days}
          items={items}
          today={today}
          canEdit={canEdit}
          onAccept={acceptItem}
          onPlace={placeItem}
        />
        <DayAgenda
          days={days}
          items={items}
          today={today}
          canEdit={canEdit}
          onAccept={acceptItem}
        />
      </div>

      <MemoryPanel entries={memory.data ?? []} locked={isGuest} />
    </section>
  )
}
