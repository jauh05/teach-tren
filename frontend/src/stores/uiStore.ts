import { create } from 'zustand'

// Open state of shared pop-ups. Not persisted: a reload closes every dialog.
interface UiState {
  // Topic or conversation id whose quiz settings are open. Null when closed.
  quizSetupFor: string | null
  openQuizSetup: (quizId: string) => void
  closeQuizSetup: () => void
}

export const useUiStore = create<UiState>()((set) => ({
  quizSetupFor: null,
  openQuizSetup: (quizId) => set({ quizSetupFor: quizId }),
  closeQuizSetup: () => set({ quizSetupFor: null }),
}))
