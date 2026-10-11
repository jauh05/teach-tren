import clsx from 'clsx'
import { isSuggestion, type ScheduleItem } from '../../domain/schedule'
import { TONE_CLASS } from './toneStyles'

interface ScheduleCardProps {
  item: ScheduleItem
  canEdit: boolean
  onAccept: (itemId: string) => void
}

// One schedule entry. Suggestions can be accepted with a tap, or dragged to another day on desktop.
export function ScheduleCard({ item, canEdit, onAccept }: ScheduleCardProps) {
  const movable = isSuggestion(item) && canEdit

  return (
    <div
      data-item-id={item.id}
      draggable={movable}
      onDragStart={(event) => {
        event.dataTransfer.setData('text/plain', item.id)
        event.dataTransfer.effectAllowed = 'move'
      }}
      className={clsx(
        'rounded-[9px] border px-2 py-1.5 text-[12px] leading-snug',
        TONE_CLASS[item.tone],
        movable && 'cursor-grab',
      )}
    >
      <p className="font-semibold">{item.title}</p>
      <p className="mt-0.5 text-[11px] opacity-80">{item.reason}</p>
      {movable && (
        <button
          type="button"
          aria-label={`Terima saran ${item.title}`}
          onClick={() => onAccept(item.id)}
          className="mt-1 min-h-[44px] text-left text-[11px] font-semibold underline md:min-h-0"
        >
          Terima
        </button>
      )}
    </div>
  )
}
