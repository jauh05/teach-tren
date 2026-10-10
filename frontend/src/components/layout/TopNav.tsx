import clsx from 'clsx'
import { Link, useLocation } from 'react-router-dom'
import { AvatarMenu } from './AvatarMenu'
import { BrandLink } from './BrandLink'
import { ModeBadge } from './ModeBadge'
import { TABS, tabForPath } from './navigation'

// Desktop and tablet top bar (768px and up). Mobile uses MobileHeader and BottomNav.
export function TopNav() {
  const { pathname } = useLocation()
  const activeTab = tabForPath(pathname)

  return (
    <header className="relative z-20 hidden h-nav shrink-0 items-center justify-between gap-3 border-b border-line px-4 md:flex">
      <BrandLink />
      <nav aria-label="Navigasi utama" className="flex gap-0.5 rounded-[10px] bg-slate-50 p-[3px]">
        {TABS.map((tab) => {
          const active = tab.id === activeTab
          return (
            <Link
              key={tab.id}
              to={tab.path}
              aria-current={active ? 'page' : undefined}
              className={clsx(
                'whitespace-nowrap rounded-lg px-3 py-[7px] text-[13px]',
                active ? 'bg-soft font-semibold text-brand-dark' : 'text-muted hover:text-ink',
              )}
            >
              {tab.label}
            </Link>
          )
        })}
      </nav>
      <div className="flex items-center gap-2">
        <ModeBadge />
        <AvatarMenu />
      </div>
    </header>
  )
}
