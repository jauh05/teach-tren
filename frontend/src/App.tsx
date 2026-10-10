import { QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { queryClient } from './lib/queryClient'
import { PlaceholderPage } from './pages/PlaceholderPage'

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<Navigate to="/chat" replace />} />
            <Route path="learning" element={<PlaceholderPage title="Learning" />} />
            <Route path="jadwal" element={<PlaceholderPage title="Jadwal" />} />
            <Route path="chat" element={<PlaceholderPage title="Chat" />} />
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
