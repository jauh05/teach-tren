import { useMutation, useQueryClient } from '@tanstack/react-query'
import clsx from 'clsx'
import { Pencil, PanelLeftClose, PanelLeftOpen, Plus, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { deleteConversation, renameConversation } from '../../api/conversations'
import { GUEST_HISTORY_LIMIT } from '../../domain/guestQuota'
import { groupConversations } from '../../domain/historyGroups'
import type { Conversation } from '../../domain/types'
import { useSessionStore } from '../../stores/sessionStore'
import { useConversations } from './useConversations'

// One labelled block in the history list.
interface HistorySection {
  key: string
  label: string
  items: Conversation[]
}

interface ChatSidebarProps {
  collapsed?: boolean
  onToggle?: () => void
  // Called after a link is followed, so the mobile drawer can close.
  onNavigate?: () => void
}

// Chat history. Used as the desktop sidebar and inside the mobile drawer.
// Users can search titles, rename, and delete their own conversations. Guests can only search.
export function ChatSidebar({ collapsed = false, onToggle, onNavigate }: ChatSidebarProps) {
  const { conversationId } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: conversations = [] } = useConversations()
  const [now] = useState(() => new Date())
  const isGuest = useSessionStore((state) => state.mode === 'guest')
  const [query, setQuery] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draftTitle, setDraftTitle] = useState('')
  const [confirmId, setConfirmId] = useState<string | null>(null)

  const rename = useMutation({
    mutationFn: ({ id, title }: { id: string; title: string }) => renameConversation(id, title),
    onSuccess: async () => {
      setEditingId(null)
      await queryClient.invalidateQueries({ queryKey: ['conversations'] })
    },
  })

  const remove = useMutation({
    mutationFn: (id: string) => deleteConversation(id),
    onSuccess: async (_data, id) => {
      setConfirmId(null)
      await queryClient.invalidateQueries({ queryKey: ['conversations'] })
      if (id === conversationId) {
        navigate('/chat')
      }
    },
  })

  // Guests see only the conversations kept on this device, up to the limit (docs/role.md 2.3).
  const sections = useMemo<HistorySection[]>(() => {
    const search = query.trim().toLowerCase()
    const matching = search ? conversations.filter((item) => item.title.toLowerCase().includes(search)) : conversations
    if (isGuest) {
      return [{ key: 'device', label: 'Di perangkat ini', items: matching.slice(0, GUEST_HISTORY_LIMIT) }]
    }
    return groupConversations(matching, now).map((group) => ({
      key: group.id,
      label: group.label,
      items: group.items,
    }))
  }, [conversations, isGuest, now, query])

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
        <input
          type="search"
          aria-label="Cari percakapan"
          placeholder="Cari judul"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="rounded-lg border border-line bg-white px-2.5 py-1.5 text-[13px] text-ink outline-none focus:border-brand"
        />
      )}

      {!collapsed && (
        <nav aria-label="Riwayat percakapan" className="flex min-h-0 flex-col gap-3 overflow-y-auto">
          {sections.length === 0 && <p className="px-2.5 text-xs text-muted">Tidak ada percakapan yang cocok.</p>}
          {sections.map((section) => (
            <div key={section.key}>
              <p className="px-2.5 pb-1 text-micro text-muted">{section.label}</p>
              <ul className="flex flex-col gap-0.5">
                {section.items.map((item) => {
                  const active = item.id === conversationId
                  if (editingId === item.id) {
                    return (
                      <li key={item.id} className="px-1">
                        <form
                          onSubmit={(event) => {
                            event.preventDefault()
                            rename.mutate({ id: item.id, title: draftTitle })
                          }}
                        >
                          <input
                            aria-label="Judul percakapan"
                            autoFocus
                            value={draftTitle}
                            onChange={(event) => setDraftTitle(event.target.value)}
                            onKeyDown={(event) => {
                              if (event.key === 'Escape') {
                                setEditingId(null)
                              }
                            }}
                            className="w-full rounded-md border border-line bg-white px-2 py-1 text-[13px] text-ink outline-none focus:border-brand"
                          />
                        </form>
                      </li>
                    )
                  }
                  if (confirmId === item.id) {
                    return (
                      <li key={item.id} className="flex items-center justify-between gap-1 rounded-lg bg-white px-2.5 py-[7px] text-[12px] text-ink">
                        <span>Hapus percakapan ini?</span>
                        <span className="flex shrink-0 gap-1">
                          <button
                            type="button"
                            onClick={() => remove.mutate(item.id)}
                            className="rounded-md bg-red-700 px-2 py-0.5 font-semibold text-white"
                          >
                            Hapus
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmId(null)}
                            className="rounded-md border border-line px-2 py-0.5 font-semibold"
                          >
                            Batal
                          </button>
                        </span>
                      </li>
                    )
                  }
                  return (
                    <li key={item.id} className="group flex items-center gap-0.5">
                      <Link
                        to={`/c/${item.id}`}
                        onClick={onNavigate}
                        aria-current={active ? 'page' : undefined}
                        className={clsx(
                          'block min-w-0 flex-1 truncate rounded-lg px-2.5 py-[7px] text-[13px]',
                          active ? 'bg-brand-soft font-semibold text-brand-dark' : 'text-ink hover:bg-white',
                        )}
                      >
                        {item.title}
                      </Link>
                      {!isGuest && (
                        <span className="flex shrink-0 opacity-100 md:opacity-0 md:group-hover:opacity-100 md:focus-within:opacity-100">
                          <button
                            type="button"
                            aria-label={`Ganti nama ${item.title}`}
                            onClick={() => {
                              setEditingId(item.id)
                              setDraftTitle(item.title)
                            }}
                            className="flex h-7 w-7 items-center justify-center rounded-md text-muted hover:bg-white hover:text-ink"
                          >
                            <Pencil size={13} aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            aria-label={`Hapus ${item.title}`}
                            onClick={() => setConfirmId(item.id)}
                            className="flex h-7 w-7 items-center justify-center rounded-md text-muted hover:bg-white hover:text-red-700"
                          >
                            <Trash2 size={13} aria-hidden="true" />
                          </button>
                        </span>
                      )}
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
          {isGuest && <p className="px-2.5 text-micro text-muted">Maksimal {GUEST_HISTORY_LIMIT} percakapan.</p>}
        </nav>
      )}
    </aside>
  )
}
