import clsx from 'clsx'
import { useSessionStore } from '../../stores/sessionStore'

interface ModeBadgeProps {
  // Compact shows only "Masuk" on mobile, matching the mockup.
  compact?: boolean
}

export function ModeBadge({ compact = false }: ModeBadgeProps) {
  const mode = useSessionStore((state) => state.mode)
  const name = useSessionStore((state) => state.account.name)

  if (mode === 'guest') {
    return (
      <span className="whitespace-nowrap rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-800">
        Tamu
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
