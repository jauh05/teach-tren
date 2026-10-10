import clsx from 'clsx'
import { dateKey, shortDayLabel } from '../../domain/week'
import type { ScheduleItem } from '../../domain/schedule'
import { ScheduleCard } from './ScheduleCard'

interface DayAgendaProps {
  days: Date[]
  items: ScheduleItem[]
  today: Date
  canEdit: boolean
  onAccept: (itemId: string) => void
}

// Mobile: one row per day, listed from Monday to Sunday (docs/role.md 3.1).
export function DayAgenda({ days, items, today, canEdit, onAccept }: DayAgendaProps) {
  const todayKey = dateKey(today)

  return (
    <div className="flex flex-col md:hidden">
      {days.map((day, index) => {
        const key = dateKey(day)
        const dayItems = items.filter((item) => item.date === key)
        return (
          <div key={key} data-day-index={index} className="flex gap-3 border-b border-line py-2.5">
            <div className="w-11 shrink-0 text-center">
              <p className="text-xs text-muted">{shortDayLabel(day)}</p>
              <p className={clsx('font-semibold', key === todayKey ? 'text-brand-dark' : 'text-ink')}>
                {day.getDate()}
              </p>
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              {dayItems.length > 0 ? (
                dayItems.map((item) => (
                  <ScheduleCard key={item.id} item={item} canEdit={canEdit} onAccept={onAccept} />
                ))
              ) : (
                <p className="py-1 text-xs text-muted">Belum ada jadwal</p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
