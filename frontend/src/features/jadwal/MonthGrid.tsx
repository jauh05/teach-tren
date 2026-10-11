import clsx from 'clsx'
import { isSuggestion, type ScheduleItem } from '../../domain/schedule'
import { dateKey } from '../../domain/week'
import { DOT_CLASS, TONE_CLASS } from './toneStyles'

const WEEKDAY_HEADERS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']

interface MonthGridProps {
  days: Date[]
  monthStart: Date
  items: ScheduleItem[]
  today: Date
  canEdit: boolean
  onPlace: (itemId: string, date: string) => void
}

// Desktop month view: six weeks in square boxes, like a printed calendar.
// Suggestions and items can be dragged to another day.
export function MonthGrid({ days, monthStart, items, today, canEdit, onPlace }: MonthGridProps) {
  const todayKey = dateKey(today)

  return (
    <div className="overflow-hidden rounded-[12px] border border-line">
      <div className="grid grid-cols-7 bg-slate-50 text-center text-xs font-semibold text-muted">
        {WEEKDAY_HEADERS.map((name, index) => (
          <div key={name} className={clsx('border-b border-r border-line py-2', index === 6 && 'border-r-0')}>
            {name}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {days.map((day, index) => {
          const key = dateKey(day)
          const inMonth = day.getMonth() === monthStart.getMonth()
          const dayItems = items.filter((item) => item.date === key)
          return (
            <section
              key={key}
              aria-label={`${day.getDate()} ${inMonth ? 'bulan ini' : 'bulan lain'}`}
              data-date={key}
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
                'flex min-h-[64px] min-w-0 flex-col gap-1 border-b border-r border-line p-1 md:min-h-[112px] md:p-1.5',
                index % 7 === 6 && 'border-r-0',
                key === todayKey ? 'bg-soft/50' : inMonth ? 'bg-white' : 'bg-slate-50',
              )}
            >
              <span
                className={clsx(
                  'self-end text-xs font-semibold',
                  inMonth ? 'text-ink' : 'text-slate-400',
                  key === todayKey && 'text-brand-dark',
                )}
              >
                {day.getDate()}
              </span>
              {/* Desktop: titles in the box. Mobile: one dot per item, the week view has the details. */}
              <div className="hidden flex-col gap-1 md:flex">
                {dayItems.map((item) => (
                  <MonthChip key={item.id} item={item} canEdit={canEdit} />
                ))}
              </div>
              <div className="flex flex-wrap gap-0.5 md:hidden">
                {dayItems.map((item) => (
                  <span key={item.id} className={clsx('h-1.5 w-1.5 rounded-full', DOT_CLASS[item.tone])} />
                ))}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}

interface MonthChipProps {
  item: ScheduleItem
  canEdit: boolean
}

// Compact item inside a month box. Full details are in the week view.
function MonthChip({ item, canEdit }: MonthChipProps) {
  const movable = canEdit && (isSuggestion(item) || item.kind !== 'ISTIRAHAT')
  return (
    <div
      data-item-id={item.id}
      draggable={movable}
      onDragStart={(event) => {
        event.dataTransfer.setData('text/plain', item.id)
        event.dataTransfer.effectAllowed = 'move'
      }}
      title={item.reason}
      className={clsx(
        'truncate rounded-md border px-1.5 py-0.5 text-[11px] leading-snug',
        TONE_CLASS[item.tone],
        movable && 'cursor-grab',
      )}
    >
      {item.title}
    </div>
  )
}
