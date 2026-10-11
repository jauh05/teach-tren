import { useQuery } from '@tanstack/react-query'
import clsx from 'clsx'
import { BookOpen, Flame, Layers, Lock, ListOrdered, Sprout, Target, type LucideIcon } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { fetchTopicGraph } from '../../api/topics'
import { Button } from '../../components/ui/Button'
import { QUIZ_COUNTS, QUIZ_LEVELS, QUIZ_STYLES, type QuizLevel, type QuizStyle } from '../../domain/quiz'
import { usePreferencesStore } from '../../stores/preferencesStore'
import { useSessionStore } from '../../stores/sessionStore'

// Atur kuis (/kuis/:quizId/atur). Choose the source, question count, level, and style, then start.
// Guests get five questions (docs/role.md 4.4).

const LEVEL_INFO: Record<QuizLevel, { icon: LucideIcon; hint: string }> = {
  Mudah: { icon: Sprout, hint: 'Konsep dasar dan hitungan singkat' },
  Sedang: { icon: Layers, hint: 'Latihan menengah dengan soal cerita' },
  Sulit: { icon: Flame, hint: 'Soal menantang dan langkah lebih panjang' },
}

const STYLE_INFO: Record<QuizStyle, { icon: LucideIcon; hint: string }> = {
  Campuran: { icon: Layers, hint: 'Pilihan ganda, soal cerita, isian, dan esai' },
  'Pilihan ganda saja': { icon: ListOrdered, hint: 'Hanya pilihan ganda, cepat dikerjakan' },
  'Banyak cerita': { icon: BookOpen, hint: 'Lebih banyak soal cerita dan esai' },
}

// Rough estimate for the summary. Not a promise.
const MINUTES_PER_QUESTION = 1

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
      <div className="mx-auto flex w-full max-w-[760px] flex-1 flex-col gap-5 px-4 pb-4 pt-6 md:px-6">
        <header className="flex flex-col gap-3 rounded-[18px] border border-line bg-white p-5 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <p className="inline-flex items-center gap-1.5 rounded-full bg-soft px-2.5 py-1 text-xs font-semibold text-brand-dark">
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

        <Card title="Jumlah soal" hint={isGuest ? 'Tamu mendapat lima soal.' : 'Setiap soal sekitar satu menit.'}>
          <div role="radiogroup" aria-label="Jumlah soal" className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
            {QUIZ_COUNTS.map((option) => {
              const selected = option === effectiveCount
              return (
                <button
                  key={option}
                  type="button"
                  role="radio"
                  aria-label={String(option)}
                  aria-checked={selected}
                  disabled={isGuest}
                  onClick={() => setCount(option)}
                  className={clsx(
                    'relative flex flex-col items-start gap-1 rounded-[14px] border p-4 text-left transition-colors disabled:cursor-not-allowed',
                    selected ? 'border-brand bg-soft ring-2 ring-brand/20' : 'border-line bg-white hover:bg-slate-50',
                    isGuest && !selected && 'opacity-50',
                  )}
                >
                  <span className="font-heading text-2xl font-semibold text-ink">{option}</span>
                  <span className="text-xs text-muted">soal, ± {option * MINUTES_PER_QUESTION} menit</span>
                  {isGuest && option !== 5 && (
                    <Lock size={14} aria-hidden="true" className="absolute right-3 top-3 text-slate-400" />
                  )}
                </button>
              )
            })}
          </div>
        </Card>

        <Card title="Tingkat" hint="Mengatur seberapa panjang langkah dan seberapa sulit soalnya.">
          <div role="radiogroup" aria-label="Tingkat" className="grid gap-2.5 md:grid-cols-3">
            {QUIZ_LEVELS.map((option) => (
              <OptionCard
                key={option}
                label={option}
                hint={LEVEL_INFO[option].hint}
                icon={LEVEL_INFO[option].icon}
                selected={option === level}
                onSelect={() => setLevel(option)}
              />
            ))}
          </div>
        </Card>

        <Card title="Gaya kuis" hint="Komposisi jenis soal di dalam kuis.">
          <div role="radiogroup" aria-label="Gaya kuis" className="grid gap-2.5 md:grid-cols-3">
            {QUIZ_STYLES.map((option) => (
              <OptionCard
                key={option}
                label={option}
                hint={STYLE_INFO[option].hint}
                icon={STYLE_INFO[option].icon}
                selected={option === style}
                onSelect={() => setStyle(option)}
              />
            ))}
          </div>
        </Card>
      </div>

      <footer className="sticky bottom-0 z-10 border-t border-line bg-white/95 px-4 py-3 backdrop-blur md:px-6">
        <div className="mx-auto flex w-full max-w-[760px] items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="font-heading text-sm font-semibold text-ink">
              {effectiveCount} soal · {level}
            </p>
            <p className="truncate text-xs text-muted">
              {style} · ± {effectiveCount * MINUTES_PER_QUESTION} menit
            </p>
          </div>
          <Button className="shrink-0 px-5 py-2.5" onClick={start}>
            Mulai kuis
          </Button>
        </div>
      </footer>
    </section>
  )
}

interface CardProps {
  title: string
  hint: string
  children: ReactNode
}

function Card({ title, hint, children }: CardProps) {
  return (
    <section aria-label={title} className="flex flex-col gap-3 rounded-[16px] border border-line bg-white p-5">
      <div>
        <h2 className="font-heading text-base font-semibold text-ink">{title}</h2>
        <p className="text-xs text-muted">{hint}</p>
      </div>
      {children}
    </section>
  )
}

interface OptionCardProps {
  label: string
  hint: string
  icon: LucideIcon
  selected: boolean
  onSelect: () => void
}

function OptionCard({ label, hint, icon: Icon, selected, onSelect }: OptionCardProps) {
  return (
    <button
      type="button"
      role="radio"
      aria-label={label}
      aria-checked={selected}
      onClick={onSelect}
      className={clsx(
        'flex min-h-[72px] items-start gap-3 rounded-[14px] border p-3.5 text-left transition-colors',
        selected ? 'border-brand bg-soft ring-2 ring-brand/20' : 'border-line bg-white hover:bg-slate-50',
      )}
    >
      <span
        className={clsx(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
          selected ? 'bg-brand text-white' : 'bg-soft text-brand-dark',
        )}
      >
        <Icon size={18} aria-hidden="true" />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-ink">{label}</span>
        <span className="mt-0.5 block text-xs leading-relaxed text-muted">{hint}</span>
      </span>
    </button>
  )
}
