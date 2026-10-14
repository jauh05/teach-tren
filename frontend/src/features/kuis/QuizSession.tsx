import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { ApiError } from '../../api/http'
import { fetchQuiz, type QuizView } from '../../api/quizzes'
import { Button } from '../../components/ui/Button'
import { RoadLoader } from '../../components/ui/RoadLoader'
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
  const { data, isPending, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['quiz', quizId, settings.count, settings.level, settings.style],
    queryFn: () => fetchQuiz(quizId, settings),
    enabled: !(isGuest && isGuestLimitReached(guestActionsUsed)),
    // Making a quiz uses AI and counts against the guest limit, so a failed request is never repeated on its own.
    // The user decides with the "Coba lagi" button.
    retry: false,
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
    // The server's own message says what happened (busy, or too many quizzes), in Bahasa Indonesia.
    const message = error instanceof ApiError ? error.message : 'Kuis belum bisa dibuat. Coba lagi beberapa saat.'
    return (
      <div className="flex flex-col items-start gap-3 p-6">
        <p role="alert" className="text-sm text-red-700">
          {message}
        </p>
        <Button onClick={() => void refetch()} disabled={isFetching}>
          Coba lagi
        </Button>
      </div>
    )
  }

  const quiz = current ?? data
  if (isPending && !quiz) {
    return (
      <RoadLoader
        message="Menyiapkan soal..."
        detail="AI membuat soal dan memeriksa kuncinya. Untuk kuis yang panjang, ini bisa memakan waktu beberapa menit."
      />
    )
  }
  if (!quiz) {
    return <RoadLoader message="Menyiapkan soal..." />
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
