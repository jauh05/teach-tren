import { PanelLeft } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { ChatSidebar } from './ChatSidebar'

// Frame for chat routes. Desktop shows the sidebar. Below 1024px it becomes a drawer (docs/role.md 3.1).
export function ChatLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)

  useEffect(() => {
    if (!drawerOpen) {
      return
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setDrawerOpen(false)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [drawerOpen])

  return (
    <div className="flex min-h-0 flex-1">
      <div className="hidden lg:flex">
        <ChatSidebar collapsed={collapsed} onToggle={() => setCollapsed((value) => !value)} />
      </div>

      {drawerOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label="Tutup riwayat"
            onClick={() => setDrawerOpen(false)}
            className="absolute inset-0 bg-slate-900/40"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Riwayat percakapan"
            className="absolute inset-y-0 left-0 max-w-[85vw] bg-white shadow-xl"
          >
            <ChatSidebar onNavigate={() => setDrawerOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex h-12 shrink-0 items-center px-3 lg:hidden">
          <button
            type="button"
            aria-label="Buka riwayat"
            onClick={() => setDrawerOpen(true)}
            className="flex h-11 w-11 items-center justify-center rounded-[10px] text-muted hover:bg-slate-50 hover:text-ink"
          >
            <PanelLeft size={20} aria-hidden="true" />
          </button>
        </div>
        <Outlet />
      </div>
    </div>
  )
}
