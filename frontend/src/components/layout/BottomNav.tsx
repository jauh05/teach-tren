import clsx from 'clsx'
import { Link, useLocation } from 'react-router-dom'
import { BOTTOM_TABS, tabForPath } from './navigation'

// Bottom navigation for phones: four tabs, 60px tall, respects the iOS safe area.
export function BottomNav() {
  const { pathname } = useLocation()
  const activeTab = tabForPath(pathname)

  return (
    <nav
      aria-label="Navigasi bawah"
      className="flex h-bottom-nav shrink-0 items-stretch justify-around border-t border-line bg-white pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      {BOTTOM_TABS.map((tab) => {
        const active = tab.id === activeTab
        const Icon = tab.icon
        return (
          <Link
            key={tab.id}
            to={tab.path}
            aria-current={active ? 'page' : undefined}
            className={clsx(
              'flex min-w-[44px] flex-1 flex-col items-center justify-center gap-1 text-micro',
              active ? 'font-semibold text-brand-dark' : 'text-muted',
            )}
          >
            <Icon size={20} aria-hidden="true" />
            <span>{tab.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
