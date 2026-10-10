import { useQuery } from '@tanstack/react-query'
import { Link, Navigate, useLocation, useParams } from 'react-router-dom'
import { fetchConversationMessages } from '../../api/conversations'
import { ConversationThread } from './ConversationThread'

// The home page sends new conversations to this id with the first message in location state.
const NEW_CONVERSATION_ID = 'baru'

function readInitialQuestion(state: unknown): string | undefined {
  if (typeof state === 'object' && state !== null && 'message' in state && typeof state.message === 'string') {
    return state.message
  }
  return undefined
}

export function ChatConversationPage() {
  const { conversationId = '' } = useParams()
  const location = useLocation()
  const isNew = conversationId === NEW_CONVERSATION_ID

  const { data, isPending } = useQuery({
    queryKey: ['messages', conversationId],
    queryFn: () => fetchConversationMessages(conversationId),
    enabled: !isNew,
  })

  if (isNew) {
    const initialQuestion = readInitialQuestion(location.state)
    if (!initialQuestion) {
      return <Navigate to="/chat" replace />
    }
    return (
      <ConversationThread
        key={location.key}
        conversationId={conversationId}
        initialMessages={[]}
        initialQuestion={initialQuestion}
      />
    )
  }

  if (isPending) {
    return <p className="p-6 text-sm text-muted">Memuat percakapan...</p>
  }

  if (!data) {
    return (
      <section className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
        <h1 className="font-heading text-xl font-semibold text-ink">Percakapan tidak ditemukan</h1>
        <Link to="/chat" className="text-sm text-brand-dark underline">
          Kembali ke Chat
        </Link>
      </section>
    )
  }

  return <ConversationThread key={conversationId} conversationId={conversationId} initialMessages={data} />
}
