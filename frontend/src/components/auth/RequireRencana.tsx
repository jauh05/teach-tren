import { useQuery } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { getRencana, RENCANA_QUERY_KEY } from '../../api/rencana'
import { useSessionStore } from '../../stores/sessionStore'

// Learning opens after the learning plan is chosen. A signed-in account without a plan goes to the wizard first.
// Guests are not asked: their Learning page is the sample canvas.
export function RequireRencana({ children }: { children: ReactNode }) {
  const mode = useSessionStore((state) => state.mode)
  const query = useQuery({ queryKey: RENCANA_QUERY_KEY, queryFn: getRencana, enabled: mode === 'signedIn' })

  if (mode !== 'signedIn') {
    return children
  }
  if (query.isPending) {
    return <p className="p-6 text-sm text-muted">Memuat...</p>
  }
  if (query.isError) {
    return <p className="p-6 text-sm text-red-700">Rencana belajar belum bisa dimuat. Muat ulang halaman ini.</p>
  }
  if (query.data === null) {
    return <Navigate to="/belajar/mulai" replace />
  }
  return children
}
