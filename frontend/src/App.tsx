import { QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Logo } from './components/Logo'
import { queryClient } from './lib/queryClient'

// Tampilan sementara sampai layout dan halaman dibangun pada langkah berikutnya.
function HalamanSementara() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 p-6 text-center">
      <Logo size={48} />
      <h1 className="text-2xl font-semibold text-ink">Teach Tren</h1>
      <p className="text-sm text-muted">Tampilan sedang disiapkan.</p>
    </main>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="*" element={<HalamanSementara />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
