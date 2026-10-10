import clsx from 'clsx'
import { PanelLeftClose, PanelLeftOpen, Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { groupConversations } from '../../domain/historyGroups'
import { useConversations } from './useConversations'

interface ChatSidebarProps {
  collapsed?: boolean
  onToggle?: () => void
  // Called after a link is followed, so the mobile drawer can close.
  onNavigate?: () => void
}

// Chat history. Used as the desktop sidebar and inside the mobile drawer.
export function ChatSidebar({ collapsed = false, onToggle, onNavigate }: ChatSidebarProps) {
  const { conversationId } = useParams()
  const { data: conversations = [] } = useConversations()
  const [now] = useState(() => new Date())
  const groups = useMemo(() => groupConversations(conversations, now), [conversations, now])

  return (
    <aside
      className={clsx(
        'flex h-full shrink-0 flex-col gap-3 border-r border-line bg-canvas py-3.5',
        collapsed ? 'w-sidebar-mini items-center px-2' : 'w-sidebar px-2.5',
      )}
    >
      {onToggle && (
        <button
          type="button"
          onClick={onToggle}
          aria-label={collapsed ? 'Buka riwayat' : 'Ciutkan riwayat'}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-white hover:text-ink"
        >
          {collapsed ? <PanelLeftOpen size={18} aria-hidden="true" /> : <PanelLeftClose size={18} aria-hidden="true" />}
        </button>
      )}

      <Link
        to="/chat"
        onClick={onNavigate}
        aria-label="Percakapan baru"
        className={clsx(
          'flex items-center gap-2 rounded-lg border border-line bg-white text-[13px] font-semibold text-ink hover:bg-slate-50',
          collapsed ? 'h-9 w-9 justify-center' : 'px-2.5 py-2',
        )}
      >
        <Plus size={16} aria-hidden="true" />
        {!collapsed && <span>Percakapan baru</span>}
      </Link>

      {!collapsed && (
        <nav aria-label="Riwayat percakapan" className="flex min-h-0 flex-col gap-3 overflow-y-auto">
          {groups.map((group) => (
            <div key={group.id}>
              <p className="px-2.5 pb-1 text-micro text-muted">{group.label}</p>
              <ul className="flex flex-col gap-0.5">
                {group.items.map((item) => {
                  const active = item.id === conversationId
                  return (
                    <li key={item.id}>
                      <Link
                        to={`/c/${item.id}`}
                        onClick={onNavigate}
                        aria-current={active ? 'page' : undefined}
                        className={clsx(
                          'block truncate rounded-lg px-2.5 py-[7px] text-[13px]',
                          active ? 'bg-soft font-semibold text-brand-dark' : 'text-ink hover:bg-white',
                        )}
                      >
                        {item.title}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </nav>
      )}
    </aside>
  )
}
