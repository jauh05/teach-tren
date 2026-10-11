import { Check, X } from 'lucide-react'
import { RichText } from '../../components/markdown/RichText'
import { Button } from '../../components/ui/Button'
import type { QuizView, ResultView, ResultItemView } from '../../api/quizzes'

const QUESTION_TYPE_LABEL = {
  PG: 'Pilihan ganda',
  CERITA: 'Soal cerita',
  ISIAN: 'Isian singkat',
  ESAI: 'Esai singkat',
} as const

interface QuizResultProps {
  quiz: QuizView
  result: ResultView
  isGuest: boolean
  onRestart: () => void
  onRetryWrong: () => void
  onExit?: () => void
  onLearning: () => void
}

// Final screen: score, one row per question with the answer and feedback, and the next actions.
export function QuizResult({ quiz, result, isGuest, onRestart, onRetryWrong, onExit, onLearning }: QuizResultProps) {
  const wrongCount = result.items.filter((item) => (item.skor ?? 0) < 100).length

  return (
    <section className="mx-auto flex w-full max-w-[720px] flex-col gap-4 px-4 py-6 md:px-6">
      <div className="rounded-[14px] border border-line bg-white p-5 text-center">
        <p className="text-xs text-muted">{result.retry ? 'Hasil ulang soal salah' : 'Skor kuis'}</p>
        <p className="font-heading text-4xl font-semibold text-ink">{result.percent ?? 0}%</p>
        <p className="text-sm text-muted">
          {result.benar} dari {result.total} soal benar penuh
        </p>
        <p className="mt-3 text-sm text-ink">
          {isGuest
            ? 'Hasil hanya tersimpan di perangkat ini. Masuk untuk menyimpan skor dan melihat pembahasan.'
            : result.retry
              ? 'Hasil ulang tidak mengubah skor yang tersimpan.'
              : `Skor masuk riwayat dan memperbarui status bulat ${quiz.topicName}.`}
        </p>
      </div>

      <ol className="flex flex-col gap-2">
        {result.items.map((item) => (
          <ResultRow key={item.id} item={item} stimulusText={result.stimuli.find((stimulus) => stimulus.id === item.stimulusId)?.text ?? null} />
        ))}
      </ol>

      <div className="flex flex-wrap gap-2">
        {wrongCount > 0 && !isGuest && (
          <Button variant="secondary" onClick={onRetryWrong}>
            Ulangi soal salah ({wrongCount})
          </Button>
        )}
        <Button variant="secondary" onClick={onRestart}>
          Ulangi kuis
        </Button>
        {onExit ? <Button onClick={onExit}>Kembali ke chat</Button> : <Button onClick={onLearning}>Kembali ke Learning</Button>}
      </div>
    </section>
  )
}

interface ResultRowProps {
  item: ResultItemView
  stimulusText: string | null
}

function ResultRow({ item, stimulusText }: ResultRowProps) {
  const correct = item.skor === 100
  const position = item.position + 1
  return (
    <li className="rounded-[12px] border border-line bg-white px-4 py-3">
      <details>
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 [&::-webkit-details-marker]:hidden">
          <span className="flex min-w-0 items-center gap-2 text-sm text-ink">
            <span className="shrink-0 text-muted">Soal {position}</span>
            <span className="truncate text-xs text-muted">{QUESTION_TYPE_LABEL[item.type]}</span>
          </span>
          <span
            className={
              correct
                ? 'flex shrink-0 items-center gap-1 text-xs font-semibold text-green-700'
                : 'flex shrink-0 items-center gap-1 text-xs font-semibold text-red-700'
            }
          >
            {correct ? <Check size={14} aria-hidden="true" /> : <X size={14} aria-hidden="true" />}
            {correct ? 'Benar' : `Nilai ${item.skor ?? 0}`}
          </span>
        </summary>
        <div className="mt-3 flex flex-col gap-2 border-t border-line pt-3 text-sm text-ink">
          {stimulusText && (
            <div className="rounded-lg bg-canvas p-3 text-xs">
              <RichText content={stimulusText} />
            </div>
          )}
          <ResultDetail item={item} />
          {item.pembahasan && (
            <div className="rounded-lg bg-brand-soft p-3">
              <p className="text-xs font-semibold text-brand-dark">Pembahasan</p>
              <div className="mt-1">
                <RichText content={item.pembahasan} />
              </div>
            </div>
          )}
          {item.pembahasan === undefined && item.type !== 'ESAI' && (
            <p className="text-xs text-muted">Pembahasan tersedia setelah masuk.</p>
          )}
        </div>
      </details>
    </li>
  )
}

// The user's answer next to the expected one, by question type.
function ResultDetail({ item }: { item: ResultItemView }) {
  if (item.type === 'ESAI') {
    return (
      <div className="flex flex-col gap-1">
        <p className="text-xs text-muted">Jawabanmu</p>
        <p className="whitespace-pre-wrap rounded-lg bg-canvas p-2.5">{item.jawaban ?? 'belum dijawab'}</p>
        <p className="text-sm">
          Nilai esai: <span className="font-semibold">{item.skor ?? 0}</span>
          {item.lowConfidence && <span className="ml-2 text-xs text-[#92400E]">Ditandai untuk ditinjau.</span>}
        </p>
        {item.umpanBalik && <p className="text-xs text-ink">{item.umpanBalik}</p>}
      </div>
    )
  }
  if (item.type === 'ISIAN') {
    return (
      <p>
        Jawabanmu: <span className="font-semibold">{item.jawaban ?? 'belum dijawab'}</span>. Jawaban yang diterima:{' '}
        <span className="font-semibold">{item.kunci}</span>
      </p>
    )
  }
  const correctOption = (item.options ?? []).find((option) => option.letter === item.kunci)
  return (
    <p>
      Pilihanmu: <span className="font-semibold">{item.jawaban ?? 'belum dijawab'}</span>. Jawaban benar:{' '}
      <span className="font-semibold">
        {item.kunci}
        {correctOption ? ` (${correctOption.text})` : ''}
      </span>
    </p>
  )
}
