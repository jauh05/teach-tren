import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { fetchQuiz, type QuizView } from '../../api/quizzes'
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

// Loads a quiz from the backend and runs it. A new run (retry or repeat) replaces the current one.
export function QuizSession({ quizId, settings, onExit }: QuizSessionProps) {
  const isGuest = useSessionStore((state) => state.mode === 'guest')
  const guestActionsUsed = useSessionStore((state) => state.guestActionsUsed)
  const [current, setCurrent] = useState<QuizView | null>(null)
  const { data, isPending, isError } = useQuery({
    queryKey: ['quiz', quizId, settings.count, settings.level, settings.style],
    queryFn: () => fetchQuiz(quizId, settings),
    enabled: !(isGuest && isGuestLimitReached(guestActionsUsed)),
  })

  // Guests who used their free actions cannot start another quiz.
  if (isGuest && isGuestLimitReached(guestActionsUsed)) {
    return (
      <section className="flex flex-1 flex-col justify-center p-6">
        <GuestLimitCard />
      </section>
    )
  }

  if (isError) {
    return (
      <p role="alert" className="p-6 text-sm text-red-700">
        Kuis belum bisa dibuat. Coba lagi beberapa saat.
      </p>
    )
  }

  const quiz = current ?? data
  if (isPending && !quiz) {
    return <p className="p-6 text-sm text-muted">Menyiapkan soal...</p>
  }
  if (!quiz) {
    return <p className="p-6 text-sm text-muted">Menyiapkan soal...</p>
  }

  return (
    <QuizRunner
      key={quiz.id}
      quiz={quiz}
      onExit={onExit}
      onNewRun={setCurrent}
      onRepeat={async () => setCurrent(await fetchQuiz(quizId, settings))}
    />
  )
}
