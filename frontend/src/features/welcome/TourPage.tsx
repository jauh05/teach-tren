import clsx from 'clsx'
import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { TourArt } from '../../components/illustrations/WelcomeArt'
import { continueAsGuest, useSessionStore } from '../../stores/sessionStore'

const SLIDES: { scene: 'memory' | 'chat' | 'roadmap' | 'progress'; title: string; text: string }[] = [
  {
    scene: 'memory',
    title: 'Learning memory',
    text: 'Learning memory mengingat apa yang sudah kamu pelajari. Setiap neuron adalah satu topik.',
  },
  {
    scene: 'chat',
    title: 'Tanya apa saja di chat',
    text: 'Minta penjelasan, soal latihan, atau ringkasan materi. Jawabannya langsung kamu baca.',
  },
  {
    scene: 'roadmap',
    title: 'Susun roadmap belajarmu',
    text: 'AI menyusun cabang belajar sesuai kelas dan mata pelajaranmu. Setiap cabang menjadi neuron yang saling terhubung.',
  },
  {
    scene: 'progress',
    title: 'Lihat kemajuanmu',
    text: 'Skor kuis mewarnai setiap neuron, dari sudah dikuasai sampai perlu diulang.',
  },
]

// Short slides after "Mulai", a tutorial before sign-up or sign-in. The last slide leads to sign-up or to the guest mode.
export function TourRoute() {
  const mode = useSessionStore((state) => state.mode)
  if (mode === 'signedIn') {
    return <Navigate to="/chat" replace />
  }
  return <TourPage />
}

// Phones: the picture above the text. Desktop: the text and buttons on the left, the big picture on the right.
function TourPage() {
  const navigate = useNavigate()
  const [index, setIndex] = useState(0)
  const slide = SLIDES[index]
  const last = index === SLIDES.length - 1

  return (
    <main className="min-h-dvh bg-brand-soft">
      <div className="mx-auto flex min-h-dvh w-full max-w-[420px] flex-col md:grid md:min-h-dvh md:max-w-6xl md:grid-cols-2 md:items-center md:gap-x-16 md:px-12 md:py-12">
        <header className="flex justify-end px-6 pt-6 md:col-start-1 md:row-start-1 md:justify-start md:px-0 md:pt-0">
          <button type="button" onClick={() => navigate('/masuk')} className="text-sm font-semibold text-muted hover:text-ink">
            Lewati
          </button>
        </header>

        <div className="mt-4 h-[340px] w-full rounded-[32px] bg-white px-4 py-3 md:col-start-2 md:row-span-3 md:row-start-1 md:mt-0 md:h-[600px] md:px-10 md:py-8">
          <TourArt scene={slide.scene} />
        </div>

        <section className="flex flex-1 flex-col items-center px-6 pt-7 text-center md:col-start-1 md:row-start-2 md:items-start md:px-0 md:pt-0 md:text-left">
          <h1 className="font-heading text-[26px] font-bold leading-tight text-ink md:text-[44px]">{slide.title}</h1>
          <p className="mt-3 text-sm text-muted md:mt-4 md:max-w-md md:text-base md:leading-7">{slide.text}</p>

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

        <div className="flex flex-col gap-3 px-6 pb-8 pt-8 md:col-start-1 md:row-start-3 md:w-[420px] md:px-0 md:pb-0 md:pt-0">
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
