import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import clsx from 'clsx'
import { CircleAlert, Check, LoaderCircle, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { generateRoadmap, getKurikulum, getRencana, RENCANA_QUERY_KEY, saveRencana } from '../../api/rencana'
import { PersonFigure } from '../../components/illustrations/PersonFigure'
import { Button } from '../../components/ui/Button'
import { useSessionStore } from '../../stores/sessionStore'
import { colors } from '../../theme/tokens'
import {
  buildPayload,
  canContinue,
  chooseGrade,
  chooseLevel,
  addCabang,
  EMPTY_DRAFT,
  hasValidRoadmap,
  MAX_CABANG,
  MAX_SUBJECTS,
  MIN_CABANG,
  nextStep,
  previousStep,
  removeCabang,
  renameCabang,
  setRoadmap,
  startManualRoadmap,
  toggleSubject,
  WIZARD_STEPS,
  type CurriculumLevel,
  type DraftRoadmap,
  type PlanDraft,
  type WizardStep,
} from '../../domain/rencana'

const STEP_TEXT: Record<WizardStep, { title: string; subtitle: string }> = {
  kelas: { title: 'Kamu kelas berapa?', subtitle: 'Pilih jenjang dan kelas. Pilihanmu dipakai untuk menyusun roadmap.' },
  mapel: { title: 'Mata pelajaran apa?', subtitle: 'Pilih satu atau lebih mata pelajaran. Roadmap dibuat dari pilihan ini.' },
  roadmap: {
    title: 'Roadmap belajarmu',
    subtitle: `Roadmap berisi ${MIN_CABANG} sampai ${MAX_CABANG} cabang. Setiap cabang menjadi neuron di Learning.`,
  },
}

// The first visit to Learning for a signed-in account: choose the level and the subjects, then accept the roadmap.
// The accepted roadmap becomes the topics on the canvas.
export function MulaiPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const signOut = useSessionStore((state) => state.signOut)
  const [step, setStep] = useState<WizardStep>('kelas')
  const [draft, setDraft] = useState<PlanDraft>(EMPTY_DRAFT)
  const [serverError, setServerError] = useState<string | null>(null)

  const curriculumQuery = useQuery({ queryKey: ['kurikulum'], queryFn: getKurikulum, staleTime: Infinity })
  const planQuery = useQuery({ queryKey: RENCANA_QUERY_KEY, queryFn: getRencana })

  const roadmapMutation = useMutation({
    mutationFn: generateRoadmap,
    onSuccess: (roadmap: DraftRoadmap) => {
      setServerError(null)
      setDraft((current) => setRoadmap(current, roadmap))
    },
    onError: (error) => {
      setServerError(error instanceof Error ? error.message : 'Roadmap belum bisa dibuat. Coba lagi.')
    },
  })

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
  const payload = buildPayload(draft)

  function requestRoadmap() {
    if (!draft.levelId || draft.grade === null) {
      return
    }
    setServerError(null)
    roadmapMutation.mutate({ levelId: draft.levelId, grade: draft.grade, subjects: draft.subjects })
  }

  function saveRoadmap() {
    if (!payload) {
      return
    }
    setServerError(null)
    save.mutate(payload)
  }

  return (
    <main className="flex min-h-dvh justify-center bg-canvas md:px-6 md:py-10">
      <div className="flex w-full max-w-[420px] flex-col overflow-hidden bg-white md:rounded-[32px] md:shadow-[0_30px_70px_-30px_rgba(20,20,20,0.25)]">
        <header className="relative h-[200px] shrink-0 overflow-hidden bg-brand">
          <svg viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full" aria-hidden="true" focusable="false">
            <path d="M-10 190 Q 110 150 220 184 T 410 168" fill="none" stroke="#FFFFFF" strokeWidth="3" strokeDasharray="2 9" strokeLinecap="round" opacity="0.85" />
            <circle cx="40" cy="186" r="7" fill="#FFFFFF" />
            <circle cx="150" cy="168" r="5" fill={colors.brand.dark} />
            <circle cx="232" cy="184" r="7" fill="#FFFFFF" />
            <circle cx="300" cy="120" r="66" fill="#FFFFFF" />
            <g transform="translate(246 62) scale(0.5)">
              <PersonFigure />
            </g>
          </svg>
          {/* The wizard comes before the rest of the app, so the way out is signing out, not going back. */}
          <button
            type="button"
            onClick={async () => {
              await signOut()
              navigate('/chat', { replace: true })
            }}
            className="absolute left-5 top-5 rounded-full bg-white px-4 py-2 text-sm font-semibold text-ink shadow-sm hover:bg-canvas"
          >
            Keluar
          </button>
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

          {step === 'kelas' && (
            <KelasStep levels={levels} draft={draft} onLevel={(id) => setDraft(chooseLevel(draft, id))} onGrade={(grade) => setDraft(chooseGrade(draft, grade))} />
          )}
          {step === 'mapel' && level && <MapelStep level={level} draft={draft} onToggle={(name) => setDraft(toggleSubject(draft, name))} />}
          {step === 'roadmap' && (
            <RoadmapStep
              draft={draft}
              pending={roadmapMutation.isPending}
              onGenerate={requestRoadmap}
              onStartManual={() => setDraft(startManualRoadmap(draft))}
              onRename={(index, name) => setDraft(renameCabang(draft, index, name))}
              onRemove={(index) => setDraft(removeCabang(draft, index))}
              onAdd={(subject, name) => setDraft(addCabang(draft, subject, name))}
            />
          )}

          <ProgressDots index={stepNumber - 1} />

          {serverError && (
            <div role="alert" className="flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              <CircleAlert size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
              <p>{serverError}</p>
            </div>
          )}

          {step === 'roadmap' ? (
            <div className="flex flex-col gap-3">
              <Button className="min-h-[52px] w-full rounded-full text-[15px]" disabled={save.isPending || !payload} onClick={saveRoadmap}>
                {save.isPending && <LoaderCircle size={16} className="animate-spin" aria-hidden="true" />}
                Simpan roadmap
              </Button>
              <button type="button" onClick={() => setStep(previous ?? 'kelas')} className="text-center text-sm font-semibold text-muted hover:text-ink">
                Kembali
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <Button className="min-h-[52px] w-full rounded-full text-[15px]" disabled={!canContinue(step, draft)} onClick={() => next && setStep(next)}>
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
                  'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-bold',
                  picked ? 'border-brand-dark bg-brand text-ink' : 'border-line text-transparent',
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

interface RoadmapStepProps {
  draft: PlanDraft
  pending: boolean
  onGenerate: () => void
  onStartManual: () => void
  onRename: (index: number, name: string) => void
  onRemove: (index: number) => void
  onAdd: (subject: string, name: string) => void
}

const SOURCE_TEXT: Record<'ai' | 'katalog' | 'manual', string> = {
  ai: 'Disusun AI sesuai kelas dan mata pelajaranmu. Kamu bisa mengubah nama, menghapus, atau menambah cabang.',
  katalog: 'Disusun dari daftar kurikulum untuk kelas dan mata pelajaranmu. Kamu bisa mengubah nama, menghapus, atau menambah cabang.',
  manual: 'Tulis materimu sendiri. Tambah 6 sampai 12 cabang.',
}

// Either the AI writes the roadmap, or the user writes it. Either way, the branches can be renamed, removed, and added to.
function RoadmapStep({ draft, pending, onGenerate, onStartManual, onRename, onRemove, onAdd }: RoadmapStepProps) {
  const [newName, setNewName] = useState('')
  const [newSubject, setNewSubject] = useState(draft.subjects[0] ?? '')

  if (!draft.roadmap) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm text-muted">Buat roadmap otomatis, atau tulis materimu sendiri.</p>
        <Button className="min-h-[48px] w-full rounded-full" disabled={pending} onClick={onGenerate}>
          {pending && <LoaderCircle size={16} className="animate-spin" aria-hidden="true" />}
          {pending ? 'Menyusun roadmap...' : 'Buat roadmap otomatis'}
        </Button>
        <button
          type="button"
          onClick={onStartManual}
          disabled={pending}
          className="min-h-[48px] w-full rounded-full border border-line bg-white text-sm font-semibold text-ink hover:border-brand-dark disabled:opacity-50"
        >
          Isi materi sendiri
        </button>
      </div>
    )
  }

  const { cabang, sumber } = draft.roadmap
  const full = cabang.length >= MAX_CABANG
  const subject = draft.subjects.includes(newSubject) ? newSubject : (draft.subjects[0] ?? '')

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-muted">{SOURCE_TEXT[sumber]}</p>

      <ol className="flex flex-col gap-2.5" aria-label="Cabang roadmap">
        {cabang.map((item, index) => (
          <li key={index} className="flex items-center gap-3 rounded-2xl border border-line bg-white px-3 py-2.5">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-soft text-xs font-bold text-brand-dark">
              {index + 1}
            </span>
            <div className="min-w-0 flex-1">
              <input
                aria-label={`Nama cabang ${index + 1}`}
                value={item.name}
                maxLength={60}
                onChange={(event) => onRename(index, event.target.value)}
                className="w-full bg-transparent font-semibold text-ink outline-none"
              />
              <p className="text-xs text-muted">{item.subject}</p>
            </div>
            <button
              type="button"
              aria-label={`Hapus cabang ${index + 1}`}
              onClick={() => onRemove(index)}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted hover:bg-slate-100 hover:text-ink"
            >
              <Trash2 size={16} aria-hidden="true" />
            </button>
          </li>
        ))}
      </ol>

      {!full && draft.subjects.length > 0 && (
        <div className="flex flex-col gap-2 rounded-2xl border border-dashed border-line p-3">
          <div className="flex items-center gap-2">
            <select
              aria-label="Mata pelajaran cabang baru"
              value={subject}
              onChange={(event) => setNewSubject(event.target.value)}
              className="rounded-full border border-line bg-white px-3 py-2 text-sm text-ink"
            >
              {draft.subjects.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input
              aria-label="Nama cabang baru"
              placeholder="Nama cabang baru"
              value={newName}
              maxLength={60}
              onChange={(event) => setNewName(event.target.value)}
              className="min-w-0 flex-1 rounded-full border border-line bg-white px-4 py-2 text-sm text-ink outline-none placeholder:text-muted focus:border-brand-dark"
            />
            <Button
              className="min-h-[40px] shrink-0 rounded-full px-4"
              disabled={newName.trim() === ''}
              onClick={() => {
                onAdd(subject, newName)
                setNewName('')
              }}
            >
              <Plus size={16} aria-hidden="true" />
              Tambah
            </Button>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-1">
        <p className="text-xs text-muted">
          {cabang.length} dari {MIN_CABANG} sampai {MAX_CABANG} cabang
        </p>
        {!hasValidRoadmap(draft) && <p className="text-xs text-red-700">Setiap cabang perlu nama yang berbeda, dan jumlahnya 6 sampai 12.</p>}
      </div>

      {sumber !== 'manual' && (
        <button type="button" disabled={pending} onClick={onGenerate} className="text-center text-sm font-semibold text-brand-dark hover:underline disabled:opacity-50">
          {pending ? 'Menyusun ulang...' : 'Buat ulang roadmap otomatis'}
        </button>
      )}
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
