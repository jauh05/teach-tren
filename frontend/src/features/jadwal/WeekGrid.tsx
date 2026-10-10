import clsx from 'clsx'
import { dateKey, shortDayLabel } from '../../domain/week'
import type { ScheduleItem } from '../../domain/schedule'
import { ScheduleCard } from './ScheduleCard'

interface WeekGridProps {
  days: Date[]
  items: ScheduleItem[]
  today: Date
  canEdit: boolean
  onAccept: (itemId: string) => void
  onPlace: (itemId: string, date: string) => void
}

// Desktop: seven columns, one per day. A dragged suggestion is placed on the day it is dropped on.
export function WeekGrid({ days, items, today, canEdit, onAccept, onPlace }: WeekGridProps) {
  const todayKey = dateKey(today)

  return (
    <div className="hidden grid-cols-7 gap-2 md:grid">
      {days.map((day, index) => {
        const key = dateKey(day)
        const dayItems = items.filter((item) => item.date === key)
        return (
          <section
            key={key}
            aria-label={`${shortDayLabel(day)} ${day.getDate()}`}
            data-day-index={index}
            onDragOver={(event) => {
              if (canEdit) {
                event.preventDefault()
              }
            }}
            onDrop={(event) => {
              event.preventDefault()
              const itemId = event.dataTransfer.getData('text/plain')
              if (canEdit && itemId) {
                onPlace(itemId, key)
              }
            }}
            className="flex min-h-[240px] min-w-0 flex-col gap-1.5"
          >
            <header className="border-b border-line pb-1.5 text-center">
              <p className="text-xs text-muted">{shortDayLabel(day)}</p>
              <p className={clsx('font-semibold', key === todayKey ? 'text-brand-dark' : 'text-ink')}>
                {day.getDate()}
              </p>
            </header>
            {dayItems.length > 0 ? (
              dayItems.map((item) => (
                <ScheduleCard key={item.id} item={item} canEdit={canEdit} onAccept={onAccept} />
              ))
            ) : (
              <p className="text-xs text-muted">Belum ada jadwal</p>
            )}
          </section>
        )
      })}
    </div>
  )
}
