import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import clsx from 'clsx'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchMemory } from '../../api/memory'
import { fetchSchedule, placeScheduleItem } from '../../api/schedule'
import { Button } from '../../components/ui/Button'
import {
  addDays,
  addMonths,
  formatMonthLabel,
  formatTodayLabel,
  formatWeekRange,
  monthGridDays,
  startOfMonth,
  startOfWeek,
  weekDays,
} from '../../domain/week'
import { useSessionStore } from '../../stores/sessionStore'
import { DayAgenda } from './DayAgenda'
import { MemoryPanel } from './MemoryPanel'
import { MonthGrid } from './MonthGrid'
import { WeekGrid } from './WeekGrid'

type CalendarView = 'minggu' | 'bulan'

const VIEW_OPTIONS: { value: CalendarView; label: string }[] = [
  { value: 'minggu', label: 'Minggu' },
  { value: 'bulan', label: 'Bulan' },
]

// Schedule (/jadwal). Guests see the same schedule as a read-only example.
export function JadwalPage() {
  const isGuest = useSessionStore((state) => state.mode === 'guest')
  const queryClient = useQueryClient()
  const [today] = useState(() => new Date())
  // Any day inside the period on screen. The week or month is derived from it.
  const [anchor, setAnchor] = useState(() => today)
  const [view, setView] = useState<CalendarView>('minggu')
  const [memoryOpen, setMemoryOpen] = useState(false)

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
  const weekStart = startOfWeek(anchor)
  const days = weekDays(weekStart)
  const monthStart = startOfMonth(anchor)
  const monthDays = monthGridDays(monthStart)

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

  function shift(step: -1 | 1) {
    setAnchor((current) => (view === 'bulan' ? addMonths(current, step) : addDays(current, 7 * step)))
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
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="font-heading text-base font-semibold text-ink">
              {view === 'bulan' ? formatMonthLabel(monthStart) : formatWeekRange(weekStart)}
            </h1>
            <p className="text-xs text-muted">Hari ini {formatTodayLabel(today)}</p>
          </div>

          <div className="flex w-full flex-wrap items-center gap-1.5 md:w-auto md:shrink-0">
            <div className="flex items-center gap-1.5">
            <div role="radiogroup" aria-label="Tampilan kalender" className="flex overflow-hidden rounded-[10px] border border-[#CBD5E1]">
              {VIEW_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  role="radio"
                  aria-checked={view === option.value}
                  onClick={() => setView(option.value)}
                  className={clsx(
                    'px-3 py-1.5 text-xs font-semibold',
                    view === option.value ? 'bg-soft text-brand-dark' : 'bg-white text-ink hover:bg-slate-50',
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              aria-pressed={memoryOpen}
              onClick={() => setMemoryOpen((value) => !value)}
              className="hidden min-h-[32px] items-center rounded-[10px] border border-[#CBD5E1] bg-white px-3 text-xs font-semibold text-ink hover:bg-slate-50 md:inline-flex"
            >
              {memoryOpen ? 'Sembunyikan Ingatan AI' : 'Ingatan AI'}
            </button>
            <Link
              to="/jadwal/ingatan"
              className="inline-flex min-h-[36px] items-center rounded-[10px] border border-[#CBD5E1] bg-white px-3 text-xs font-semibold text-ink md:hidden"
            >
              Ingatan AI
            </Link>
            </div>
            <div className="flex items-center gap-1.5">
            <button
              type="button"
              aria-label={view === 'bulan' ? 'Bulan sebelumnya' : 'Minggu sebelumnya'}
              onClick={() => shift(-1)}
              className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-[#CBD5E1] bg-white text-ink"
            >
              <ChevronLeft size={16} aria-hidden="true" />
            </button>
            <Button variant="secondary" className="min-h-[36px]" onClick={() => setAnchor(new Date())}>
              Hari ini
            </Button>
            <button
              type="button"
              aria-label={view === 'bulan' ? 'Bulan berikutnya' : 'Minggu berikutnya'}
              onClick={() => shift(1)}
              className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-[#CBD5E1] bg-white text-ink"
            >
              <ChevronRight size={16} aria-hidden="true" />
            </button>
            </div>
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

        {view === 'bulan' ? (
          <MonthGrid
            days={monthDays}
            monthStart={monthStart}
            items={items}
            today={today}
            canEdit={canEdit}
            onPlace={placeItem}
          />
        ) : (
          <>
            <WeekGrid
              days={days}
              items={items}
              today={today}
              canEdit={canEdit}
              onAccept={acceptItem}
              onPlace={placeItem}
            />
            <DayAgenda days={days} items={items} today={today} canEdit={canEdit} onAccept={acceptItem} />
          </>
        )}
      </div>

      {memoryOpen && <MemoryPanel entries={memory.data ?? []} locked={isGuest} />}
    </section>
  )
}
