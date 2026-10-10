import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

export type QuestionCount = 5 | 10 | 15 | 20
export type QuizLevel = 'Mudah' | 'Sedang' | 'Sulit'
export type QuizStyle = 'Campuran' | 'Pilihan ganda saja' | 'Banyak cerita'
export type ThemeChoice = 'light' | 'system'

export interface Preferences {
  questionCount: QuestionCount
  level: QuizLevel
  quizStyle: QuizStyle
  quickChoiceAfterMaterial: boolean
  theme: ThemeChoice
  reminderEnabled: boolean
  // Local time in 24-hour format, HH:mm.
  reminderTime: string
}

export const DEFAULT_PREFERENCES: Preferences = {
  questionCount: 10,
  level: 'Sedang',
  quizStyle: 'Campuran',
  quickChoiceAfterMaterial: true,
  theme: 'light',
  reminderEnabled: true,
  reminderTime: '16:00',
}

interface PreferencesState extends Preferences {
  updatePreferences: (patch: Partial<Preferences>) => void
}

// Per-device preferences (docs/role.md 4.7). Stored in the browser, not on the server.
export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      ...DEFAULT_PREFERENCES,
      updatePreferences: (patch) => set(patch),
    }),
    {
      name: 'teach-tren-preferences',
      storage: createJSONStorage(() => localStorage),
    },
  ),
)
