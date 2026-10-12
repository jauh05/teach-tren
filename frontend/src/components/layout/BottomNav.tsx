import clsx from 'clsx'
import { Link, useLocation } from 'react-router-dom'
import { BOTTOM_TABS, tabForPath } from './navigation'

// Bottom navigation for phones. It uses the same white pill and black active tab as the desktop top bar,
// with the icon above each label. It respects the iOS safe area.
export function BottomNav() {
  const { pathname } = useLocation()
  const activeTab = tabForPath(pathname)

  return (
    <nav
      aria-label="Navigasi bawah"
      className="flex h-bottom-nav shrink-0 items-center px-3 pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <div className="flex w-full items-stretch gap-1 rounded-full bg-white p-1 shadow-sm">
        {BOTTOM_TABS.map((tab) => {
          const active = tab.id === activeTab
          const Icon = tab.icon
          return (
            <Link
              key={tab.id}
              to={tab.path}
              aria-current={active ? 'page' : undefined}
              className={clsx(
                'flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-full py-1 text-micro',
                active ? 'bg-ink font-semibold text-white' : 'text-muted',
              )}
            >
              <Icon size={18} strokeWidth={2} aria-hidden="true" />
              <span className="truncate">{tab.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
