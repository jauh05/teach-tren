import { create } from 'zustand'
import type { QuizSettings } from '../domain/quiz'

// A quiz running inside a chat. quizId is the chat's id (a topic id or a conversation id).
export interface ChatQuizRun {
  quizId: string
  settings: QuizSettings
}

// Open state of shared pop-ups and of the quiz shown inside a chat. Not persisted: a reload closes them.
interface UiState {
  // Topic or conversation id whose quiz settings are open. Null when closed.
  quizSetupFor: string | null
  openQuizSetup: (quizId: string) => void
  closeQuizSetup: () => void
  // Quiz shown in place of the chat thread with the same id. Null when no quiz runs in a chat.
  chatQuiz: ChatQuizRun | null
  // True while the quiz of chatQuiz is being prepared by the server. The Generate soal button shows it.
  quizLoading: boolean
  startChatQuiz: (run: ChatQuizRun) => void
  endChatQuiz: () => void
  setQuizLoading: (loading: boolean) => void
  // Set by a button elsewhere (for example "Buat" under the next steps). Learning opens the add-topic dialog and clears it.
  addTopicRequested: boolean
  requestAddTopic: () => void
  clearAddTopicRequest: () => void
}

export const useUiStore = create<UiState>()((set) => ({
  quizSetupFor: null,
  openQuizSetup: (quizId) => set({ quizSetupFor: quizId }),
  closeQuizSetup: () => set({ quizSetupFor: null }),
  chatQuiz: null,
  quizLoading: false,
  startChatQuiz: (run) => set({ chatQuiz: run, quizLoading: true }),
  endChatQuiz: () => set({ chatQuiz: null, quizLoading: false }),
  setQuizLoading: (loading) => set({ quizLoading: loading }),
  addTopicRequested: false,
  requestAddTopic: () => set({ addTopicRequested: true }),
  clearAddTopicRequest: () => set({ addTopicRequested: false }),
}))
