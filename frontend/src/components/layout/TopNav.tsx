import clsx from 'clsx'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useSessionStore } from '../../stores/sessionStore'
import { Button } from '../ui/Button'
import { AvatarMenu } from './AvatarMenu'
import { BrandLink } from './BrandLink'
import { ModeBadge } from './ModeBadge'
import { TOP_TABS, tabForPath } from './navigation'

// Desktop and tablet top bar (768px and up). Mobile uses MobileHeader and BottomNav.
export function TopNav() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const mode = useSessionStore((state) => state.mode)
  const activeTab = tabForPath(pathname)

  return (
    <header className="relative z-20 hidden h-nav shrink-0 items-center justify-between gap-3 px-4 md:flex">
      <BrandLink />
      <nav aria-label="Navigasi utama" className="flex gap-1 rounded-full bg-white p-1 shadow-sm">
        {TOP_TABS.map((tab) => {
          const active = tab.id === activeTab
          return (
            <Link
              key={tab.id}
              to={tab.path}
              aria-current={active ? 'page' : undefined}
              className={clsx(
                'whitespace-nowrap rounded-full px-4 py-1.5 text-[13px]',
                active ? 'bg-ink font-semibold text-white' : 'text-muted hover:text-ink',
              )}
            >
              {tab.label}
            </Link>
          )
        })}
      </nav>
      <div className="flex items-center gap-2">
        <ModeBadge />
        {mode === 'guest' && (
          <Button className="min-h-[36px] md:min-h-[36px]" onClick={() => navigate('/masuk')}>
            Masuk
          </Button>
        )}
        <AvatarMenu />
      </div>
    </header>
  )
}
