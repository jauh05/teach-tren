import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { fetchTopicGraph } from '../../api/topics'
import type { QuizLevel, QuizStyle } from '../../domain/quiz'
import { usePreferencesStore } from '../../stores/preferencesStore'
import { useSessionStore } from '../../stores/sessionStore'

// Guests get five questions (docs/role.md 4.4).
export const GUEST_COUNT = 5

export interface QuizSetupDraft {
  isGuest: boolean
  // Effective count: always GUEST_COUNT for guests.
  count: number
  level: QuizLevel
  style: QuizStyle
  setCount: (value: number) => void
  setLevel: (value: QuizLevel) => void
  setStyle: (value: QuizStyle) => void
}

// Choices start from the saved preferences. Changes stay in this draft until the user starts the quiz.
export function useQuizSetupDraft(): QuizSetupDraft {
  const isGuest = useSessionStore((state) => state.mode === 'guest')
  // One selector per value: a selector that builds a new object would re-render forever.
  const defaultCount = usePreferencesStore((state) => state.questionCount)
  const defaultLevel = usePreferencesStore((state) => state.level)
  const defaultStyle = usePreferencesStore((state) => state.quizStyle)
  const [count, setCount] = useState<number>(defaultCount)
  const [level, setLevel] = useState<QuizLevel>(defaultLevel)
  const [style, setStyle] = useState<QuizStyle>(defaultStyle)

  return {
    isGuest,
    count: isGuest ? GUEST_COUNT : count,
    level,
    style,
    setCount,
    setLevel,
    setStyle,
  }
}

// Name of the topic the quiz is built from. Falls back to a general label.
export function useQuizSourceName(quizId: string): string {
  const topics = useQuery({ queryKey: ['topics'], queryFn: fetchTopicGraph })
  return topics.data?.topics.find((topic) => topic.id === quizId)?.name ?? 'Latihan umum'
}

// Address of the quiz run that the chosen settings produce.
export function quizStartUrl(quizId: string, draft: Pick<QuizSetupDraft, 'count' | 'level' | 'style'>): string {
  const params = new URLSearchParams({ jumlah: String(draft.count), tingkat: draft.level, gaya: draft.style })
  return `/kuis/${quizId}?${params.toString()}`
}
