import { useQuery } from '@tanstack/react-query'
import clsx from 'clsx'
import { useState, type ReactNode } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { fetchTopicGraph } from '../../api/topics'
import { Button } from '../../components/ui/Button'
import { QUIZ_COUNTS, QUIZ_LEVELS, QUIZ_STYLES, type QuizLevel, type QuizStyle } from '../../domain/quiz'
import { usePreferencesStore } from '../../stores/preferencesStore'
import { useSessionStore } from '../../stores/sessionStore'

// Atur kuis (/kuis/:quizId/atur). Choose the source, question count, level, and style, then start.
// Guests get five questions (docs/role.md 4.4).
export function KuisAturPage() {
  const { quizId = '' } = useParams()
  const navigate = useNavigate()
  const isGuest = useSessionStore((state) => state.mode === 'guest')
  // One selector per value: a selector that builds a new object would re-render forever.
  const defaultCount = usePreferencesStore((state) => state.questionCount)
  const defaultLevel = usePreferencesStore((state) => state.level)
  const defaultStyle = usePreferencesStore((state) => state.quizStyle)
  const [count, setCount] = useState<number>(defaultCount)
  const [level, setLevel] = useState<QuizLevel>(defaultLevel)
  const [style, setStyle] = useState<QuizStyle>(defaultStyle)
  const topics = useQuery({ queryKey: ['topics'], queryFn: fetchTopicGraph })
  const sourceName = topics.data?.topics.find((topic) => topic.id === quizId)?.name ?? 'Latihan umum'

  const effectiveCount = isGuest ? 5 : count

  function start() {
    const params = new URLSearchParams({ jumlah: String(effectiveCount), tingkat: level, gaya: style })
    navigate(`/kuis/${quizId}?${params.toString()}`)
  }

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-canvas">
      <div className="mx-auto flex w-full max-w-[560px] flex-col gap-4 px-4 py-6 md:px-6">
        <div>
          <p className="text-xs text-muted">Sumber: {sourceName}</p>
          <h1 className="font-heading text-xl font-semibold text-ink">Atur kuis</h1>
        </div>

        <div className="flex flex-col gap-4 rounded-[16px] border border-line bg-white p-5">
          <Field label="Jumlah soal">
            <Choices
              label="Jumlah soal"
              options={QUIZ_COUNTS}
              value={effectiveCount}
              disabled={isGuest}
              onChange={(value) => setCount(value)}
            />
            {isGuest && <p className="text-xs text-muted">Tamu mendapat lima soal. Masuk untuk memilih 5 sampai 20 soal.</p>}
          </Field>
          <Field label="Tingkat">
            <Choices label="Tingkat" options={QUIZ_LEVELS} value={level} onChange={(value) => setLevel(value)} />
          </Field>
          <Field label="Gaya kuis">
            <Choices label="Gaya kuis" options={QUIZ_STYLES} value={style} onChange={(value) => setStyle(value)} />
            <p className="text-xs text-muted">
              {style === 'Campuran' && 'Pilihan ganda, soal cerita, isian, dan esai.'}
              {style === 'Pilihan ganda saja' && 'Hanya pilihan ganda.'}
              {style === 'Banyak cerita' && 'Lebih banyak soal cerita dan esai.'}
            </p>
          </Field>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <Link to="/learning" className="text-sm font-semibold text-muted hover:text-ink">
            Batal
          </Link>
          <Button onClick={start}>Mulai kuis</Button>
        </div>
      </div>
    </section>
  )
}

interface FieldProps {
  label: string
  children: ReactNode
}

function Field({ label, children }: FieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-semibold text-ink">{label}</p>
      {children}
    </div>
  )
}

interface ChoicesProps<T extends string | number> {
  label: string
  options: readonly T[]
  value: T
  disabled?: boolean
  onChange: (value: T) => void
}

function Choices<T extends string | number>({ label, options, value, disabled = false, onChange }: ChoicesProps<T>) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-1.5">
      {options.map((option) => {
        const selected = option === value
        return (
          <button
            key={String(option)}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={disabled}
            onClick={() => onChange(option)}
            className={clsx(
              'min-h-[44px] rounded-full border px-3.5 text-[13px] disabled:cursor-not-allowed disabled:opacity-60 md:min-h-[36px]',
              selected ? 'border-[#93C5FD] bg-soft font-semibold text-brand-dark' : 'border-line bg-white text-ink',
            )}
          >
            {String(option)}
          </button>
        )
      })}
    </div>
  )
}
