import clsx from 'clsx'
import { guestQuotaText, isGuestLimitReached } from '../../domain/guestQuota'
import { useSessionStore } from '../../stores/sessionStore'

interface ModeBadgeProps {
  // Compact shows only "Masuk" on mobile, matching the mockup.
  compact?: boolean
}

export function ModeBadge({ compact = false }: ModeBadgeProps) {
  const mode = useSessionStore((state) => state.mode)
  const name = useSessionStore((state) => state.account.name)
  const guestActionsUsed = useSessionStore((state) => state.guestActionsUsed)

  if (mode === 'guest') {
    if (compact) {
      return (
        <span className="whitespace-nowrap rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-800">
          Tamu
        </span>
      )
    }
    const exhausted = isGuestLimitReached(guestActionsUsed)
    return (
      <span
        className={clsx(
          'whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold',
          exhausted ? 'bg-red-50 text-red-800' : 'bg-slate-100 text-ink',
        )}
      >
        Tamu · {guestQuotaText(guestActionsUsed)}
      </span>
    )
  }

  return (
    <span
      className={clsx(
        'whitespace-nowrap rounded-full bg-soft px-2.5 py-0.5 text-xs font-semibold text-brand-dark',
      )}
    >
      {compact ? 'Masuk' : name.split(' ')[0]}
    </span>
  )
}
