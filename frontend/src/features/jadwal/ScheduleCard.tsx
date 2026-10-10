import clsx from 'clsx'
import { isSuggestion, type ScheduleItem, type ScheduleTone } from '../../domain/schedule'

// Colors follow the mockup (docs/design/html/05-jadwal-desktop.html).
const TONE_CLASS: Record<ScheduleTone, string> = {
  mastered: 'border-[#BBF7D0] bg-[#F0FDF4] text-[#166534]',
  learning: 'border-[#FDE68A] bg-[#FFFBEB] text-[#92400E]',
  review: 'border-[#FECACA] bg-[#FEF2F2] text-[#991B1B]',
  suggested: 'border-[1.5px] border-dashed border-status-saran bg-[#F5F3FF] text-[#6D28D9]',
  rest: 'border-line bg-slate-50 text-slate-600',
}

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
