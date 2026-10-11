import clsx from 'clsx'
import type { ScheduleItem } from '../../domain/schedule'
import { dateKey, shortDayLabel } from '../../domain/week'
import { ScheduleCard } from './ScheduleCard'

interface WeekGridProps {
  days: Date[]
  items: ScheduleItem[]
  today: Date
  canEdit: boolean
  onAccept: (itemId: string) => void
  onPlace: (itemId: string, date: string) => void
}

// Desktop week view drawn as a calendar grid: one bordered box per day.
// A dragged suggestion is placed on the day it is dropped on.
export function WeekGrid({ days, items, today, canEdit, onAccept, onPlace }: WeekGridProps) {
  const todayKey = dateKey(today)

  return (
    <div className="hidden overflow-hidden rounded-[12px] border border-line md:block">
      <div className="grid grid-cols-7 bg-slate-50 text-center text-xs font-semibold text-muted">
        {days.map((day, index) => {
          const key = dateKey(day)
          return (
            <div
              key={key}
              className={clsx('border-b border-r border-line py-2', index === 6 && 'border-r-0')}
            >
              {shortDayLabel(day)}{' '}
              <span className={clsx('font-semibold', key === todayKey ? 'text-brand-dark' : 'text-ink')}>
                {day.getDate()}
              </span>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-7">
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
              className={clsx(
                'flex min-h-[460px] min-w-0 flex-col gap-1.5 border-r border-line p-2',
                index === 6 && 'border-r-0',
                key === todayKey ? 'bg-brand-soft/50' : 'bg-white',
              )}
            >
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
    </div>
  )
}
