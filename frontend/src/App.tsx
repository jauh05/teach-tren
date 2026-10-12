import { QueryClientProvider } from '@tanstack/react-query'
import { useEffect, type ReactNode } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { ChatConversationPage } from './features/chat/ChatConversationPage'
import { ChatHomePage } from './features/chat/ChatHomePage'
import { LearningPage } from './features/learning/LearningPage'
import { QuizPage } from './features/kuis/QuizPage'
import { JadwalPage } from './features/jadwal/JadwalPage'
import { MemoryPage } from './features/jadwal/MemoryPage'
import { ChatLayout } from './features/chat/ChatLayout'
import { queryClient } from './lib/queryClient'
import { useSessionStore } from './stores/sessionStore'
import { hydratePreferences } from './stores/preferencesStore'
import { ReminderWatcher } from './components/ReminderWatcher'
import { RequireSignedIn } from './components/auth/RequireSignedIn'
import { PengaturanPage } from './features/pengaturan/PengaturanPage'
import { AuthPage } from './features/auth/AuthPage'
import { PlaceholderPage } from './pages/PlaceholderPage'
import { TentangPage } from './features/tentang/TentangPage'
import { MateriPage } from './features/materi/MateriPage'
import { KuisAturPage } from './features/kuis/KuisAturPage'
import { QuizSetupDialog } from './features/kuis/QuizSetupDialog'
import { MulaiPage } from './features/belajar/MulaiPage'
import { WelcomeRoute } from './features/welcome/WelcomePage'
import { TourRoute } from './features/welcome/TourPage'
import { RequireRencana } from './components/auth/RequireRencana'

// Waits for the server to say whether a session exists, so pages never flash in the wrong mode.
function SessionGate({ children }: { children: ReactNode }) {
  const ready = useSessionStore((state) => state.ready)
  const loadSession = useSessionStore((state) => state.loadSession)

  useEffect(() => {
    void loadSession().then(() => hydratePreferences())
  }, [loadSession])

  if (!ready) {
    return <p className="p-6 text-sm text-muted">Memuat...</p>
  }
  return (
    <>
      {children}
      <ReminderWatcher />
    </>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SessionGate>
        <BrowserRouter>
          <QuizSetupDialog />
          <Routes>
            {/* A signed-in account without a learning plan sees the wizard first, on whatever page it opens. */}
            <Route
              element={
                <RequireRencana>
                  <AppShell />
                </RequireRencana>
              }
            >
              <Route path="learning" element={<LearningPage />} />
              <Route path="jadwal" element={<JadwalPage />} />
              <Route path="jadwal/ingatan" element={<MemoryPage />} />
              <Route element={<ChatLayout />}>
                <Route path="chat" element={<ChatHomePage />} />
                <Route path="c/:conversationId" element={<ChatConversationPage />} />
              </Route>
              <Route path="kuis/:quizId" element={<QuizPage />} />
              <Route path="kuis/:quizId/atur" element={<KuisAturPage />} />
              <Route
                path="pengaturan"
                element={
                  <RequireSignedIn>
                    <PengaturanPage />
                  </RequireSignedIn>
                }
              />
              <Route path="tentang" element={<TentangPage />} />
              <Route
                path="materi"
                element={
                  <RequireSignedIn>
                    <MateriPage />
                  </RequireSignedIn>
                }
              />
              <Route path="*" element={<PlaceholderPage title="Halaman tidak ditemukan" />} />
            </Route>
            {/* The welcome screen is the front door for guests. A signed-in account is sent to the chat from here. */}
            <Route path="/" element={<WelcomeRoute />} />
            <Route path="tur" element={<TourRoute />} />
            <Route path="masuk" element={<AuthPage kind="masuk" />} />
            <Route path="daftar" element={<AuthPage kind="daftar" />} />
            <Route
              path="belajar/mulai"
              element={
                <RequireSignedIn>
                  <MulaiPage />
                </RequireSignedIn>
              }
            />
          </Routes>
        </BrowserRouter>
      </SessionGate>
    </QueryClientProvider>
  )
}
