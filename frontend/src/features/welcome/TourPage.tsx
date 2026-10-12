import clsx from 'clsx'
import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { TourArt } from '../../components/illustrations/WelcomeArt'
import { continueAsGuest, useSessionStore } from '../../stores/sessionStore'

const SLIDES: { scene: 'chat' | 'roadmap' | 'progress'; title: string; text: string }[] = [
  {
    scene: 'chat',
    title: 'Tanya apa saja di chat',
    text: 'Minta penjelasan, soal latihan, atau ringkasan materi. Jawabannya langsung kamu baca.',
  },
  {
    scene: 'roadmap',
    title: 'Susun roadmap belajarmu',
    text: 'AI membuat cabang belajar sesuai kelas dan mata pelajaranmu. Kamu bisa mengubahnya sebelum mulai.',
  },
  {
    scene: 'progress',
    title: 'Lihat kemajuanmu',
    text: 'Skor kuis mewarnai setiap bulat, dari sudah dikuasai sampai perlu diulang.',
  },
]

// Three short slides after "Mulai". The last slide leads to sign-up or to the guest mode.
export function TourRoute() {
  const mode = useSessionStore((state) => state.mode)
  if (mode === 'signedIn') {
    return <Navigate to="/chat" replace />
  }
  return <TourPage />
}

function TourPage() {
  const navigate = useNavigate()
  const [index, setIndex] = useState(0)
  const slide = SLIDES[index]
  const last = index === SLIDES.length - 1

  return (
    <main className="flex min-h-dvh justify-center bg-brand-soft md:px-6 md:py-10">
      <div className="flex w-full max-w-[420px] flex-col overflow-hidden bg-brand-soft md:rounded-[32px] md:shadow-[0_30px_70px_-30px_rgba(20,20,20,0.2)]">
        <header className="flex justify-end px-6 pt-6">
          <button type="button" onClick={() => navigate('/masuk')} className="text-sm font-semibold text-muted hover:text-ink">
            Lewati
          </button>
        </header>

        <section className="flex flex-1 flex-col items-center px-6 pt-4 text-center">
          <div className="h-[340px] w-full rounded-[32px] bg-white">
            <TourArt scene={slide.scene} />
          </div>
          <h1 className="mt-7 font-heading text-[26px] font-bold leading-tight text-ink">{slide.title}</h1>
          <p className="mt-3 text-sm text-muted">{slide.text}</p>

          <div className="mt-6 flex items-center gap-2" role="group" aria-label="Halaman tur">
            {SLIDES.map((item, position) => (
              <span
                key={item.scene}
                aria-current={position === index ? 'step' : undefined}
                className={clsx('h-2 rounded-full transition-all', position === index ? 'w-6 bg-brand-dark' : 'w-2 bg-line')}
              />
            ))}
          </div>
        </section>

        <div className="flex flex-col gap-3 px-6 pb-8 pt-8">
          {last ? (
            <>
              <button
                type="button"
                onClick={() => navigate('/daftar')}
                className="min-h-[52px] w-full rounded-full bg-brand text-[15px] font-semibold text-ink hover:bg-brand-dark hover:text-white"
              >
                Daftar akun
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
            </>
          ) : (
            <button
              type="button"
              onClick={() => setIndex((value) => value + 1)}
              className="min-h-[52px] w-full rounded-full bg-brand text-[15px] font-semibold text-ink hover:bg-brand-dark hover:text-white"
            >
              Lanjut
            </button>
          )}
        </div>
      </div>
    </main>
  )
}
