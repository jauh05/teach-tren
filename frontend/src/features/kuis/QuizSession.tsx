import { useQuery } from '@tanstack/react-query'
import { fetchQuiz } from '../../api/quizzes'
import { isGuestLimitReached } from '../../domain/guestQuota'
import type { QuizSettings } from '../../domain/quiz'
import { useSessionStore } from '../../stores/sessionStore'
import { GuestLimitCard } from '../guest/GuestLimitCard'
import { QuizRunner } from './QuizRunner'

interface QuizSessionProps {
  quizId: string
  settings: QuizSettings
  // Set when the quiz runs inside a chat. The result then offers a way back to that chat.
  onExit?: () => void
}

// Loads one quiz run and shows it. The quiz page and the quiz inside a chat both use this.
export function QuizSession({ quizId, settings, onExit }: QuizSessionProps) {
  const isGuest = useSessionStore((state) => state.mode === 'guest')
  const guestActionsUsed = useSessionStore((state) => state.guestActionsUsed)
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

  return (
    <QuizRunner
      key={`${quizId}-${settings.count}-${settings.level}-${settings.style}`}
      quiz={data}
      onExit={onExit}
    />
  )
}
