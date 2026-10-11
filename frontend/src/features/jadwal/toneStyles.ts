import type { ScheduleTone } from '../../domain/schedule'

// Colors follow the mockup (docs/design/html/05-jadwal-desktop.html).
// Solid dot per tone, used where a full chip does not fit (mobile month view).
export const DOT_CLASS: Record<ScheduleTone, string> = {
  mastered: 'bg-status-kuasai',
  learning: 'bg-status-sedang',
  review: 'bg-status-ulang',
  suggested: 'bg-status-saran',
  rest: 'bg-status-belum',
}

export const TONE_CLASS: Record<ScheduleTone, string> = {
  mastered: 'border-[#BBF7D0] bg-[#F0FDF4] text-[#166534]',
  learning: 'border-[#FDE68A] bg-[#FFFBEB] text-[#92400E]',
  review: 'border-[#FECACA] bg-[#FEF2F2] text-[#991B1B]',
  suggested: 'border-[1.5px] border-dashed border-status-saran bg-[#F5F3FF] text-[#6D28D9]',
  rest: 'border-line bg-slate-50 text-slate-600',
}
