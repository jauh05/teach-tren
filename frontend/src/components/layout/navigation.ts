import { CalendarDays, Info, MessageSquare, Network, Settings } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export type TabId = 'learning' | 'jadwal' | 'chat' | 'pengaturan' | 'tentang'

export interface TabItem {
  id: TabId
  label: string
  path: string
  icon: LucideIcon
}

// Order follows docs/role.md 3.1: Learning, Jadwal, Chat, Pengaturan, Tentang.
export const TABS: TabItem[] = [
  { id: 'learning', label: 'Learning', path: '/learning', icon: Network },
  { id: 'jadwal', label: 'Jadwal', path: '/jadwal', icon: CalendarDays },
  { id: 'chat', label: 'Chat', path: '/chat', icon: MessageSquare },
  { id: 'pengaturan', label: 'Pengaturan', path: '/pengaturan', icon: Settings },
  { id: 'tentang', label: 'Tentang', path: '/tentang', icon: Info },
]

// Desktop top bar shows Learning, Jadwal, and Chat. Pengaturan and Tentang open from the avatar menu.
export const TOP_TABS: TabItem[] = TABS.filter((tab) => tab.id !== 'pengaturan' && tab.id !== 'tentang')

// Mobile bottom navigation has four tabs. Tentang opens from the avatar menu instead.
export const BOTTOM_TABS: TabItem[] = TABS.filter((tab) => tab.id !== 'tentang')

// Maps a pathname to the tab that should look active. Kuis pages keep Chat active, as in the mockup.
export function tabForPath(pathname: string): TabId | null {
  if (pathname.startsWith('/learning')) return 'learning'
  if (pathname.startsWith('/jadwal')) return 'jadwal'
  if (pathname === '/chat' || pathname.startsWith('/c/') || pathname.startsWith('/kuis/')) {
    return 'chat'
  }
  if (pathname.startsWith('/pengaturan')) return 'pengaturan'
  if (pathname.startsWith('/tentang')) return 'tentang'
  return null
}
