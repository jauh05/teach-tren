import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import clsx from 'clsx'
import { ArrowLeft, Check, CircleAlert, LoaderCircle } from 'lucide-react'
import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { getKurikulum, getRencana, RENCANA_QUERY_KEY, saveRencana } from '../../api/rencana'
import { PersonFigure } from '../../components/illustrations/PersonFigure'
import { Button } from '../../components/ui/Button'
import {
  buildPayload,
  canContinue,
  chooseGrade,
  chooseLevel,
  EMPTY_DRAFT,
  isTopicSelected,
  MAX_SUBJECTS,
  nextStep,
  previousStep,
  toggleSubject,
  toggleTopic,
  WIZARD_STEPS,
  type CurriculumLevel,
  type PlanDraft,
  type WizardStep,
} from '../../domain/rencana'

const STEP_TEXT: Record<WizardStep, { title: string; subtitle: string }> = {
  kelas: { title: 'Kamu kelas berapa?', subtitle: 'Pilih jenjang dan kelas. Pilihanmu dipakai untuk menyusun roadmap.' },
  mapel: { title: 'Mata pelajaran apa?', subtitle: 'Pilih satu atau lebih mata pelajaran. Setiap mata pelajaran menjadi satu jalur.' },
  materi: {
    title: 'Materi apa yang ingin dipelajari?',
    subtitle: 'Setiap materi menjadi bulat di Learning. Langkah ini boleh dilewati.',
  },
}

// The first visit to Learning for a signed-in account: choose the level, the subjects, and the materials.
// The saved choices become the roadmap on the canvas.
export function MulaiPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [step, setStep] = useState<WizardStep>('kelas')
  const [draft, setDraft] = useState<PlanDraft>(EMPTY_DRAFT)
  const [serverError, setServerError] = useState<string | null>(null)

  const curriculumQuery = useQuery({ queryKey: ['kurikulum'], queryFn: getKurikulum, staleTime: Infinity })
  const planQuery = useQuery({ queryKey: RENCANA_QUERY_KEY, queryFn: getRencana })

  const save = useMutation({
    mutationFn: saveRencana,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: RENCANA_QUERY_KEY })
      navigate('/learning', { replace: true })
    },
    onError: (error) => {
      setServerError(error instanceof Error ? error.message : 'Rencana belum bisa disimpan. Coba lagi.')
    },
  })

  // The wizard runs once. An account that already has a plan goes straight to Learning.
  if (planQuery.data) {
    return <Navigate to="/learning" replace />
  }
  if (curriculumQuery.isPending || planQuery.isPending) {
    return <p className="p-6 text-sm text-muted">Memuat...</p>
  }
  if (curriculumQuery.isError || !curriculumQuery.data) {
    return <p className="p-6 text-sm text-red-700">Pilihan belajar belum bisa dimuat. Muat ulang halaman ini.</p>
  }

  const levels = curriculumQuery.data
  const level = levels.find((item) => item.id === draft.levelId)
  const stepNumber = WIZARD_STEPS.indexOf(step) + 1
  const previous = previousStep(step)
  const next = nextStep(step)

  // Saves the plan. "Lewati materi" saves it without materials, so the roadmap starts empty.
  function submit(skipMaterials: boolean) {
    const payload = buildPayload(draft, level)
    if (!payload) {
      return
    }
    setServerError(null)
    save.mutate(skipMaterials ? { ...payload, topics: [] } : payload)
  }

  return (
    <main className="flex min-h-dvh justify-center bg-canvas md:px-6 md:py-10">
      <div className="flex w-full max-w-[420px] flex-col overflow-hidden bg-white md:rounded-[32px] md:shadow-[0_30px_70px_-30px_rgba(20,20,20,0.25)]">
        <header className="relative h-[200px] shrink-0 overflow-hidden bg-brand">
          <svg viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full" aria-hidden="true" focusable="false">
            <circle cx="300" cy="120" r="66" fill="#FFFFFF" />
            <g transform="translate(246 62) scale(0.5)">
              <PersonFigure />
            </g>
          </svg>
          <Link
            to="/chat"
            aria-label="Kembali ke chat"
            className="absolute left-5 top-5 flex h-10 w-10 items-center justify-center rounded-full bg-white text-ink shadow-sm"
          >
            <ArrowLeft size={18} aria-hidden="true" />
          </Link>
          <p className="absolute bottom-14 left-6 font-heading text-2xl font-bold text-ink">Rencana belajar</p>
        </header>

        <section className="-mt-8 flex flex-1 flex-col gap-5 rounded-t-[32px] bg-white px-6 pb-8 pt-14">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-dark">
              Langkah {stepNumber} dari {WIZARD_STEPS.length}
            </p>
            <h1 className="mt-1 font-heading text-2xl font-bold text-ink">{STEP_TEXT[step].title}</h1>
            <p className="mt-1 text-sm text-muted">{STEP_TEXT[step].subtitle}</p>
          </div>

          {step === 'kelas' && <KelasStep levels={levels} draft={draft} onLevel={(id) => setDraft(chooseLevel(draft, id))} onGrade={(grade) => setDraft(chooseGrade(draft, grade))} />}
          {step === 'mapel' && level && <MapelStep level={level} draft={draft} onToggle={(name) => setDraft(toggleSubject(draft, name))} />}
          {step === 'materi' && level && (
            <MateriStep level={level} draft={draft} onToggle={(subject, name) => setDraft(toggleTopic(draft, subject, name))} />
          )}

          <ProgressDots index={stepNumber - 1} />

          {serverError && (
            <div role="alert" className="flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              <CircleAlert size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
              <p>{serverError}</p>
            </div>
          )}

          {step === 'materi' ? (
            <div className="flex flex-col gap-3">
              <Button className="min-h-[52px] w-full rounded-full text-[15px]" disabled={save.isPending || !buildPayload(draft, level)} onClick={() => submit(false)}>
                {save.isPending && <LoaderCircle size={16} className="animate-spin" aria-hidden="true" />}
                Buat rencana
              </Button>
              <div className="flex items-center justify-between text-sm">
                <button type="button" onClick={() => setStep(previous ?? 'kelas')} className="font-semibold text-muted hover:text-ink">
                  Kembali
                </button>
                <button
                  type="button"
                  disabled={save.isPending}
                  onClick={() => submit(true)}
                  className="font-semibold text-brand-dark hover:underline disabled:opacity-50"
                >
                  Lewati materi
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <Button
                className="min-h-[52px] w-full rounded-full text-[15px]"
                disabled={!canContinue(step, draft)}
                onClick={() => next && setStep(next)}
              >
                Lanjut
              </Button>
              {previous && (
                <button type="button" onClick={() => setStep(previous)} className="text-center text-sm font-semibold text-muted hover:text-ink">
                  Kembali
                </button>
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}

function KelasStep({
  levels,
  draft,
  onLevel,
  onGrade,
}: {
  levels: CurriculumLevel[]
  draft: PlanDraft
  onLevel: (id: CurriculumLevel['id']) => void
  onGrade: (grade: number) => void
}) {
  const level = levels.find((item) => item.id === draft.levelId)
  return (
    <div className="flex flex-col gap-5">
      <div role="radiogroup" aria-label="Jenjang" className="grid grid-cols-4 gap-1 rounded-full border border-line bg-white p-1 shadow-sm">
        {levels.map((item) => {
          const selected = item.id === draft.levelId
          return (
            <button
              key={item.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onLevel(item.id)}
              className={clsx('rounded-full py-2 text-sm font-semibold transition-colors', selected ? 'bg-ink text-white' : 'text-muted hover:text-ink')}
            >
              {item.label}
            </button>
          )
        })}
      </div>

      {level ? (
        <div>
          <p className="text-sm font-semibold text-ink">{level.gradeUnit} berapa?</p>
          <div role="radiogroup" aria-label={level.gradeUnit} className="mt-3 flex flex-wrap gap-2">
            {level.grades.map((grade) => {
              const selected = grade === draft.grade
              return (
                <button
                  key={grade}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => onGrade(grade)}
                  className={clsx(
                    'rounded-full border px-4 py-2 text-sm font-semibold transition-colors',
                    selected ? 'border-brand-dark bg-brand text-ink' : 'border-line text-ink hover:border-brand-dark',
                  )}
                >
                  {level.gradeUnit} {grade}
                </button>
              )
            })}
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted">Pilih jenjang dulu.</p>
      )}
    </div>
  )
}

function MapelStep({ level, draft, onToggle }: { level: CurriculumLevel; draft: PlanDraft; onToggle: (name: string) => void }) {
  const full = draft.subjects.length >= MAX_SUBJECTS
  return (
    <div className="flex flex-col gap-3">
      <div role="group" aria-label="Mata pelajaran" className="flex flex-col gap-2.5">
        {level.subjects.map((subject) => {
          const picked = draft.subjects.includes(subject.name)
          return (
            <button
              key={subject.name}
              type="button"
              aria-pressed={picked}
              disabled={!picked && full}
              onClick={() => onToggle(subject.name)}
              className={clsx(
                'flex w-full items-center justify-between rounded-2xl border px-4 py-3.5 text-left transition-colors disabled:opacity-50',
                picked ? 'border-brand-dark bg-brand-soft' : 'border-line bg-white hover:border-brand-dark',
              )}
            >
              <span className="font-semibold text-ink">{subject.name}</span>
              <span
                className={clsx(
                  'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border',
                  picked ? 'border-brand-dark bg-brand text-ink' : 'border-line',
                )}
                aria-hidden="true"
              >
                {picked && <Check size={14} />}
              </span>
            </button>
          )
        })}
      </div>
      <p className="text-xs text-muted">Pilih sampai {MAX_SUBJECTS} mata pelajaran.</p>
    </div>
  )
}

function MateriStep({ level, draft, onToggle }: { level: CurriculumLevel; draft: PlanDraft; onToggle: (subject: string, name: string) => void }) {
  if (draft.subjects.length === 0) {
    return <p className="text-sm text-muted">Belum ada mata pelajaran dipilih.</p>
  }
  return (
    <div className="flex flex-col gap-6">
      {draft.subjects.map((subjectName) => {
        const subject = level.subjects.find((item) => item.name === subjectName)
        if (!subject) {
          return null
        }
        const count = draft.topics.filter((topic) => topic.subject === subjectName).length
        return (
          <section key={subjectName} aria-label={subjectName} className="flex flex-col gap-3">
            <div className="flex items-baseline justify-between">
              <h2 className="font-semibold text-ink">{subjectName}</h2>
              <span className="text-xs text-muted">{count} dipilih</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {subject.topics.map((topic) => {
                const picked = isTopicSelected(draft, subjectName, topic)
                return (
                  <button
                    key={topic}
                    type="button"
                    aria-pressed={picked}
                    onClick={() => onToggle(subjectName, topic)}
                    className={clsx(
                      'rounded-full border px-3.5 py-1.5 text-left text-sm font-medium transition-colors',
                      picked ? 'border-brand-dark bg-brand text-ink' : 'border-line text-ink hover:border-brand-dark',
                    )}
                  >
                    {topic}
                  </button>
                )
              })}
            </div>
          </section>
        )
      })}
    </div>
  )
}

// Three dots joined by lines, like the step indicator of the reference design. Dots up to the current step are filled.
function ProgressDots({ index }: { index: number }) {
  return (
    <div className="flex items-center justify-center gap-2" aria-hidden="true">
      {WIZARD_STEPS.map((step, position) => (
        <span key={step} className="flex items-center gap-2">
          <span className={clsx('h-3 w-3 rounded-full border-2', position <= index ? 'border-ink bg-ink' : 'border-line bg-white')} />
          {position < WIZARD_STEPS.length - 1 && <span className={clsx('h-0.5 w-10 rounded-full', position < index ? 'bg-ink' : 'bg-line')} />}
        </span>
      ))}
    </div>
  )
}
