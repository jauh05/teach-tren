import { QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { ChatConversationPage } from './features/chat/ChatConversationPage'
import { ChatHomePage } from './features/chat/ChatHomePage'
import { LearningPage } from './features/learning/LearningPage'
import { ChatLayout } from './features/chat/ChatLayout'
import { queryClient } from './lib/queryClient'
import { PlaceholderPage } from './pages/PlaceholderPage'

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<Navigate to="/chat" replace />} />
            <Route path="learning" element={<LearningPage />} />
            <Route path="jadwal" element={<PlaceholderPage title="Jadwal" />} />
            <Route element={<ChatLayout />}>
              <Route path="chat" element={<ChatHomePage />} />
              <Route path="c/:conversationId" element={<ChatConversationPage />} />
            </Route>
            <Route path="pengaturan" element={<PlaceholderPage title="Pengaturan" />} />
            <Route path="tentang" element={<PlaceholderPage title="Tentang" />} />
            <Route path="materi" element={<PlaceholderPage title="Materi" />} />
            <Route path="*" element={<PlaceholderPage title="Halaman tidak ditemukan" />} />
          </Route>
          <Route path="masuk" element={<PlaceholderPage title="Masuk" />} />
          <Route path="daftar" element={<PlaceholderPage title="Daftar" />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
