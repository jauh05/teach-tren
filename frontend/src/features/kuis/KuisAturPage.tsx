import { useNavigate, useParams, Link } from 'react-router-dom'
import { Target } from 'lucide-react'
import { QuizSetupCards, QuizSetupSummary } from './QuizSetup'
import { quizStartUrl, useQuizSetupDraft, useQuizSourceName } from './quizSetupDraft'

// Atur kuis as a full page (/kuis/:quizId/atur), for direct links. Learning and Chat open the same settings as a pop-up.
export function KuisAturPage() {
  const { quizId = '' } = useParams()
  const navigate = useNavigate()
  const draft = useQuizSetupDraft()
  const sourceName = useQuizSourceName(quizId)

  function start() {
    navigate(quizStartUrl(quizId, draft))
  }

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-canvas">
      <div className="mx-auto flex w-full max-w-[760px] flex-1 flex-col gap-5 px-4 pb-4 pt-6 md:px-6">
        <header className="flex flex-col gap-3 rounded-[18px] border border-line bg-white p-5 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <p className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-2.5 py-1 text-xs font-semibold text-brand-dark">
              <Target size={13} aria-hidden="true" />
              {sourceName}
            </p>
            <h1 className="mt-2 font-heading text-2xl font-semibold text-ink">Atur kuis</h1>
            <p className="mt-1 text-sm text-muted">Pilih jumlah soal, tingkat, dan gaya. Kuis dibuat dari topik ini.</p>
          </div>
          <Link to="/learning" className="self-start text-sm font-semibold text-muted hover:text-ink md:self-center">
            Batal
          </Link>
        </header>

        <QuizSetupCards draft={draft} />
      </div>

      <footer className="sticky bottom-0 z-10 border-t border-line bg-white/95 px-4 py-3 backdrop-blur md:px-6">
        <div className="mx-auto w-full max-w-[760px]">
          <QuizSetupSummary draft={draft} onStart={start} />
        </div>
      </footer>
    </section>
  )
}
