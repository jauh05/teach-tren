import { useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { fetchQuiz } from '../../api/quizzes'
import { isGuestLimitReached } from '../../domain/guestQuota'
import { useSessionStore } from '../../stores/sessionStore'
import { GuestLimitCard } from '../guest/GuestLimitCard'
import { QuizRunner } from './QuizRunner'

// Quiz (/kuis/:quizId). The id is a topic id or a conversation id.
export function QuizPage() {
  const { quizId = '' } = useParams()
  const isGuest = useSessionStore((state) => state.mode === 'guest')
  const guestActionsUsed = useSessionStore((state) => state.guestActionsUsed)
  const { data, isPending, isError } = useQuery({
    queryKey: ['quiz', quizId],
    queryFn: () => fetchQuiz(quizId),
  })

  // Guests who used their free actions cannot start another quiz.
  if (isGuest && isGuestLimitReached(guestActionsUsed)) {
    return (
      <section className="flex flex-1 flex-col justify-center p-6">
        <GuestLimitCard />
      </section>
    )
  }

  if (isPending) {
    return <p className="p-6 text-sm text-muted">Memuat kuis...</p>
  }

  if (isError) {
    return (
      <p role="alert" className="p-6 text-sm text-red-700">
        Kuis belum bisa dimuat. Coba muat ulang halaman.
      </p>
    )
  }

  return <QuizRunner key={quizId} quiz={data} />
}
