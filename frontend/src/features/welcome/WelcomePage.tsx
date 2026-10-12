import { Link, Navigate, useNavigate } from 'react-router-dom'
import { WelcomeHero } from '../../components/illustrations/WelcomeArt'
import { BrandLink } from '../../components/layout/BrandLink'
import { continueAsGuest, useSessionStore } from '../../stores/sessionStore'

// The first screen for a guest. The rest of the app can be used from here, as a guest or after signing in.
// A signed-in account skips it and goes to the chat, where the learning plan is checked.
export function WelcomeRoute() {
  const mode = useSessionStore((state) => state.mode)
  if (mode === 'signedIn') {
    return <Navigate to="/chat" replace />
  }
  return <WelcomePage />
}

function WelcomePage() {
  const navigate = useNavigate()

  return (
    <main className="flex min-h-dvh justify-center bg-brand-soft md:px-6 md:py-10">
      <div className="flex w-full max-w-[420px] flex-col overflow-hidden bg-brand-soft md:rounded-[32px] md:shadow-[0_30px_70px_-30px_rgba(20,20,20,0.2)]">
        <header className="px-6 pt-6">
          <BrandLink />
        </header>

        <section className="flex flex-1 flex-col items-center px-6 pt-4 text-center">
          <div className="h-[340px] w-full">
            <WelcomeHero />
          </div>
          <h1 className="mt-2 font-heading text-[30px] font-bold leading-tight text-ink">Belajar lebih terarah, satu bulat satu langkah</h1>
          <p className="mt-3 text-sm text-muted">Chat, kuis, dan roadmap belajarmu dalam satu tempat.</p>
        </section>

        <div className="flex flex-col gap-3 px-6 pb-8 pt-8">
          <button
            type="button"
            onClick={() => navigate('/tur')}
            className="min-h-[52px] w-full rounded-full bg-brand text-[15px] font-semibold text-ink hover:bg-brand-dark hover:text-white"
          >
            Mulai
          </button>
          <button
            type="button"
            onClick={async () => {
              await continueAsGuest()
              navigate('/chat', { replace: true })
            }}
            className="min-h-[48px] w-full rounded-full border border-line bg-white text-sm font-semibold text-ink hover:border-brand-dark"
          >
            Lanjut sebagai tamu
          </button>
          <p className="text-center text-sm text-muted">
            Sudah punya akun?{' '}
            <Link to="/masuk" className="font-semibold text-brand-dark hover:underline">
              Masuk
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}
