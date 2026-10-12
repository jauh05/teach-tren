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

// Phones: one column, the illustration above the text. Desktop: two columns, the text on the left and the illustration on the right.
function WelcomePage() {
  const navigate = useNavigate()

  return (
    <main className="min-h-dvh bg-brand-soft">
      <div className="mx-auto flex min-h-dvh w-full max-w-[420px] flex-col md:grid md:min-h-dvh md:max-w-6xl md:grid-cols-2 md:items-center md:gap-x-16 md:px-12 md:py-12">
        <header className="px-6 pt-6 md:col-start-1 md:row-start-1 md:px-0 md:pt-0">
          <BrandLink />
        </header>

        <div className="h-[340px] w-full md:col-start-2 md:row-span-3 md:row-start-1 md:h-[560px]">
          <WelcomeHero />
        </div>

        <section className="flex flex-col items-center px-6 pt-4 text-center md:col-start-1 md:row-start-2 md:items-start md:px-0 md:pt-0 md:text-left">
          <h1 className="mt-2 font-heading text-[30px] font-bold leading-tight text-ink md:mt-0 md:text-[52px] md:leading-[1.08]">
            Belajar lebih terarah, satu neuron satu langkah
          </h1>
          <p className="mt-3 text-sm text-muted md:mt-5 md:max-w-md md:text-base md:leading-7">
            Chat, kuis, dan roadmap belajarmu dalam satu tempat.
          </p>
        </section>

        <div className="flex flex-col gap-3 px-6 pb-8 pt-8 md:col-start-1 md:row-start-3 md:w-[420px] md:px-0 md:pb-0 md:pt-0">
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
