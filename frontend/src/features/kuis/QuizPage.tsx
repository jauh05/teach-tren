import { useQuery } from '@tanstack/react-query'
import { useParams, useSearchParams } from 'react-router-dom'
import { fetchQuiz } from '../../api/quizzes'
import { isGuestLimitReached } from '../../domain/guestQuota'
import { parseQuizSettings } from '../../domain/quiz'
import { useSessionStore } from '../../stores/sessionStore'
import { GuestLimitCard } from '../guest/GuestLimitCard'
import { QuizRunner } from './QuizRunner'

// Quiz (/kuis/:quizId). Settings come from the Atur page as query parameters.
// The id is a topic id or a conversation id.
export function QuizPage() {
  const { quizId = '' } = useParams()
  const [params] = useSearchParams()
  const isGuest = useSessionStore((state) => state.mode === 'guest')
  const guestActionsUsed = useSessionStore((state) => state.guestActionsUsed)
  const settings = parseQuizSettings(params, isGuest)
  const { data, isPending, isError } = useQuery({
    queryKey: ['quiz', quizId, settings.count, settings.level, settings.style],
    queryFn: () => fetchQuiz(quizId, settings),
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

  return <QuizRunner key={`${quizId}-${settings.count}-${settings.level}-${settings.style}`} quiz={data} />
}
