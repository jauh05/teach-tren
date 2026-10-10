import type { Conversation } from './types'

export type HistoryGroupId = 'today' | 'yesterday' | 'last7Days' | 'older'

export interface HistoryGroup {
  id: HistoryGroupId
  label: string
  items: Conversation[]
}

const GROUP_ORDER: HistoryGroupId[] = ['today', 'yesterday', 'last7Days', 'older']

const GROUP_LABELS: Record<HistoryGroupId, string> = {
  today: 'Hari ini',
  yesterday: 'Kemarin',
  last7Days: '7 hari terakhir',
  older: 'Lebih lama',
}

const DAY_MS = 24 * 60 * 60 * 1000

function startOfLocalDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
}

// Compares calendar days in local time, so late-night activity still counts as "yesterday".
export function historyGroupOf(updatedAt: Date, now: Date): HistoryGroupId {
  const days = Math.round((startOfLocalDay(now) - startOfLocalDay(updatedAt)) / DAY_MS)
  if (days <= 0) return 'today'
  if (days === 1) return 'yesterday'
  if (days <= 7) return 'last7Days'
  return 'older'
}

// Groups conversations for the sidebar. Empty groups are omitted. Newest first inside a group.
export function groupConversations(conversations: Conversation[], now: Date): HistoryGroup[] {
  const sorted = [...conversations].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  const buckets = new Map<HistoryGroupId, Conversation[]>()

  for (const conversation of sorted) {
    const id = historyGroupOf(new Date(conversation.updatedAt), now)
    buckets.set(id, [...(buckets.get(id) ?? []), conversation])
  }

  return GROUP_ORDER.filter((id) => buckets.has(id)).map((id) => ({
    id,
    label: GROUP_LABELS[id],
    items: buckets.get(id) ?? [],
  }))
}
