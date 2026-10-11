import clsx from 'clsx'
import { BookOpen, Flame, Layers, ListOrdered, Lock, Sprout, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from '../../components/ui/Button'
import { QUIZ_COUNTS, QUIZ_LEVELS, QUIZ_STYLES, type QuizLevel, type QuizStyle } from '../../domain/quiz'
import { GUEST_COUNT, type QuizSetupDraft } from './quizSetupDraft'

// Shared pieces of Atur kuis. The full page (/kuis/:quizId/atur) and the pop-up both use them.
// Hooks and URL helpers live in quizSetupDraft.ts, so this file only exports components.

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

interface QuizSetupCardsProps {
  draft: QuizSetupDraft
}

// The three choice groups: question count, level, and style.
export function QuizSetupCards({ draft }: QuizSetupCardsProps) {
  const { isGuest, count, level, style, setCount, setLevel, setStyle } = draft

  return (
    <div className="flex flex-col gap-5">
      <Card title="Jumlah soal" hint={isGuest ? 'Tamu mendapat lima soal.' : 'Setiap soal sekitar satu menit.'}>
        <div role="radiogroup" aria-label="Jumlah soal" className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
          {QUIZ_COUNTS.map((option) => {
            const selected = option === count
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
                  selected ? 'border-brand bg-brand-soft ring-2 ring-brand/20' : 'border-line bg-white hover:bg-slate-50',
                  isGuest && !selected && 'opacity-50',
                )}
              >
                <span className="font-heading text-2xl font-semibold text-ink">{option}</span>
                <span className="text-xs text-muted">soal, ± {option * MINUTES_PER_QUESTION} menit</span>
                {isGuest && option !== GUEST_COUNT && (
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
  )
}

interface QuizSetupSummaryProps {
  draft: QuizSetupDraft
  onStart: () => void
}

// One line of the chosen settings, with the start button.
export function QuizSetupSummary({ draft, onStart }: QuizSetupSummaryProps) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="font-heading text-sm font-semibold text-ink">
          {draft.count} soal · {draft.level}
        </p>
        <p className="truncate text-xs text-muted">
          {draft.style} · ± {draft.count * MINUTES_PER_QUESTION} menit
        </p>
      </div>
      <Button className="shrink-0 px-5 py-2.5" onClick={onStart}>
        Mulai kuis
      </Button>
    </div>
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
        selected ? 'border-brand bg-brand-soft ring-2 ring-brand/20' : 'border-line bg-white hover:bg-slate-50',
      )}
    >
      <span
        className={clsx(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
          selected ? 'bg-brand text-white' : 'bg-brand-soft text-brand-dark',
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
