import { Outlet } from 'react-router-dom'
import { BottomNav } from './BottomNav'
import { MobileHeader } from './MobileHeader'
import { TopNav } from './TopNav'

// Shared frame for every main page. Pages own their scrolling inside <main>.
export function AppShell() {
  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-canvas">
      <TopNav />
      <MobileHeader />
      <main className="flex min-h-0 flex-1 flex-col">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}
