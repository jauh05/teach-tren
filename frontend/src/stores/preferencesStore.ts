import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { fetchPreferences, savePreferences } from '../api/preferences'
import { useSessionStore } from './sessionStore'

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
  hydrate: (preferences: Preferences) => void
}

function snapshot(state: Preferences): Preferences {
  return {
    questionCount: state.questionCount,
    level: state.level,
    quizStyle: state.quizStyle,
    quickChoiceAfterMaterial: state.quickChoiceAfterMaterial,
    theme: state.theme,
    reminderEnabled: state.reminderEnabled,
    reminderTime: state.reminderTime,
  }
}

// Counts changes made on this device. A load that started before a change must not overwrite it.
let localChanges = 0

// Preferences are kept on the device. A signed-in user's changes are also saved to the account.
export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set, get) => ({
      ...DEFAULT_PREFERENCES,
      updatePreferences: (patch) => {
        localChanges += 1
        set(patch)
        if (useSessionStore.getState().mode === 'signedIn') {
          void savePreferences(snapshot(get())).catch(() => undefined)
        }
      },
      hydrate: (preferences) => set(preferences),
    }),
    {
      name: 'teach-tren-preferences',
      storage: createJSONStorage(() => localStorage),
    },
  ),
)

// Loads the saved preferences of a signed-in user. If the server cannot be reached, the device's values stay.
// If the user changed a preference while the load was running, the newer device value is kept.
export async function hydratePreferences(): Promise<void> {
  if (useSessionStore.getState().mode !== 'signedIn') {
    return
  }
  const changesBefore = localChanges
  try {
    const saved = await fetchPreferences()
    if (localChanges === changesBefore) {
      usePreferencesStore.getState().hydrate(saved)
    }
  } catch {
    // Keep the values from this device.
  }
}
