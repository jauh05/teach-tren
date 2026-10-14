import clsx from 'clsx'
import { Check, X } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { answerQuizItem, retryWrongQuestions, submitQuiz, type AnswerView, type QuizQuestionView, type QuizView, type ResultView } from '../../api/quizzes'
import { RichText } from '../../components/markdown/RichText'
import { Button } from '../../components/ui/Button'
import { wordCount } from '../../domain/penilaian'
import { useSessionStore } from '../../stores/sessionStore'
import { QuizResult } from './QuizResult'

const SEGMENT_CLASS = {
  correct: 'bg-status-kuasai',
  partial: 'bg-status-sedang',
  wrong: 'bg-status-ulang',
  current: 'bg-brand',
  pending: 'bg-line',
} as const

const QUESTION_TYPE_LABEL = {
  PG: 'Pilihan ganda',
  CERITA: 'Soal cerita',
  ISIAN: 'Isian singkat',
  ESAI: 'Esai singkat',
} as const

type OptionTone = 'idle' | 'correct' | 'wrong'

const OPTION_CLASS: Record<OptionTone, string> = {
  idle: 'border-line bg-white',
  correct: 'border-status-kuasai bg-[#F0FDF4]',
  wrong: 'border-status-ulang bg-[#FEF2F2]',
}

interface QuizRunnerProps {
  quiz: QuizView
  onExit?: () => void
  // Shows a new run (retry of the wrong questions) in place of this one.
  onNewRun: (quiz: QuizView) => void
  // Starts the same settings again with new questions.
  onRepeat: () => Promise<void>
}

// One question per screen. The server grades each answer. Essays are graded when the quiz is submitted.
export function QuizRunner({ quiz, onExit, onNewRun, onRepeat }: QuizRunnerProps) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const mode = useSessionStore((state) => state.mode)
  const isGuest = mode === 'guest'

  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [checks, setChecks] = useState<Record<string, AnswerView>>({})
  const [flagged, setFlagged] = useState<Record<string, boolean>>({})
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ResultView | null>(null)

  const total = quiz.questions.length
  const question = quiz.questions[index]
  if (!question) {
    return <p className="p-6 text-sm text-muted">Kuis ini belum memiliki soal.</p>
  }

  if (result) {
    return (
      <QuizResult
        quiz={quiz}
        result={result}
        isGuest={isGuest}
        onRestart={async () => {
          setBusy(true)
          try {
            await onRepeat()
          } catch {
            setError('Kuis baru belum bisa dibuat. Coba lagi beberapa saat.')
          } finally {
            setBusy(false)
          }
        }}
        onRetryWrong={async () => {
          setBusy(true)
          try {
            onNewRun(await retryWrongQuestions(quiz.id))
          } catch {
            setError('Soal salah belum bisa diulang. Coba lagi beberapa saat.')
          } finally {
            setBusy(false)
          }
        }}
        onExit={onExit}
        onLearning={() => navigate('/learning')}
      />
    )
  }

  const check = checks[question.id]
  const answer = answers[question.id]
  const essayAnswered = question.type === 'ESAI' && answer !== undefined
  const revealed = check !== undefined || essayAnswered
  const stimulus = quiz.stimuli.find((item) => item.id === question.stimulusId)

  // Records an answer on the server and shows its result.
  async function send(text: string) {
    setBusy(true)
    setError(null)
    try {
      const response = await answerQuizItem(quiz.id, question.id, text)
      setAnswers((previous) => ({ ...previous, [question.id]: text }))
      if (question.type !== 'ESAI') {
        setChecks((previous) => ({ ...previous, [question.id]: response }))
      }
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Jawaban belum tersimpan. Coba lagi.')
    } finally {
      setBusy(false)
    }
  }

  function choose(letter: string) {
    if (revealed || busy) {
      return
    }
    void send(letter)
  }

  function submitText(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const text = (drafts[question.id] ?? '').trim()
    if (text === '' || revealed || busy) {
      return
    }
    void send(text)
  }

  async function finish() {
    setBusy(true)
    setError(null)
    try {
      setResult(await submitQuiz(quiz.id))
      // The first full run changes the score of its neuron (backend). Refresh the canvas and the memory so the new status shows.
      await Promise.all([queryClient.invalidateQueries({ queryKey: ['topics'] }), queryClient.invalidateQueries({ queryKey: ['memory'] })])
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Kuis belum bisa dikumpulkan. Coba lagi.')
    } finally {
      setBusy(false)
    }
  }

  function goNext() {
    if (index < total - 1) {
      setIndex(index + 1)
      return
    }
    void finish()
  }

  function toggleFlag() {
    setFlagged((previous) => ({ ...previous, [question.id]: !previous[question.id] }))
  }

  const states = quiz.questions.map((item, position) => {
    const itemCheck = checks[item.id]
    if (itemCheck) {
      return itemCheck.skor === 100 ? 'correct' : 'wrong'
    }
    if (answers[item.id] !== undefined) {
      return 'partial'
    }
    return position === index ? 'current' : 'pending'
  })
  const correctCount = states.filter((state) => state === 'correct').length
  const wrongCount = states.filter((state) => state === 'wrong').length

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <div className="mx-auto flex w-full max-w-[720px] flex-col gap-3.5 px-4 py-5 md:px-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-xs text-muted">
              {quiz.subject} · {quiz.topicName} · {quiz.level} · {quiz.style}
            </p>
            <p className="font-heading text-base font-semibold text-ink">
              Soal {index + 1} dari {total}
              {quiz.retry && <span className="ml-2 text-xs font-normal text-muted">ulangi soal salah</span>}
            </p>
          </div>
          {check && <FeedbackBadge score={check.skor ?? 0} choice={question.type !== 'ISIAN'} />}
        </div>

        <div role="img" aria-label={`Progres: ${correctCount} benar, ${wrongCount} salah`} className="flex gap-1.5">
          {states.map((state, position) => (
            <span key={quiz.questions[position].id} className={clsx('h-[5px] flex-1 rounded-full', SEGMENT_CLASS[state])} />
          ))}
        </div>

        <QuestionCard question={question} stimulusText={stimulus?.text ?? null} />

        {question.type === 'PG' || question.type === 'CERITA' ? (
          <ul className="flex flex-col gap-2">
            {(question.options ?? []).map((option) => {
              const picked = answer === option.letter
              const tone: OptionTone = !check
                ? 'idle'
                : option.letter === check.kunci
                  ? 'correct'
                  : picked
                    ? 'wrong'
                    : 'idle'
              return (
                <li key={option.letter}>
                  <button
                    type="button"
                    aria-label={`Pilihan ${option.letter}`}
                    aria-pressed={picked}
                    disabled={revealed || busy}
                    onClick={() => choose(option.letter)}
                    className={clsx(
                      'flex min-h-[48px] w-full items-center gap-2.5 rounded-xl border px-3.5 py-3 text-left text-ink transition-colors disabled:cursor-default',
                      OPTION_CLASS[tone],
                      !revealed && 'hover:bg-slate-50',
                    )}
                  >
                    <span className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full border border-line bg-white text-xs font-semibold">
                      {option.letter}
                    </span>
                    <span className="min-w-0 flex-1">
                      <RichText content={option.text} />
                    </span>
                    {tone === 'correct' && (
                      <span className="flex shrink-0 items-center gap-1 text-xs font-semibold text-green-700">
                        <Check size={14} aria-hidden="true" />
                        Benar
                      </span>
                    )}
                    {tone === 'wrong' && (
                      <span className="flex shrink-0 items-center gap-1 text-xs font-semibold text-red-700">
                        <X size={14} aria-hidden="true" />
                        Pilihanmu
                      </span>
                    )}
                  </button>
                </li>
              )
            })}
          </ul>
        ) : question.type === 'ISIAN' ? (
          <div className="flex flex-col gap-2">
            <form onSubmit={submitText} className="flex flex-col gap-2 sm:flex-row">
              <input
                aria-label="Jawaban isian"
                value={revealed ? (answer ?? '') : (drafts[question.id] ?? '')}
                disabled={revealed || busy}
                onChange={(event) => setDrafts((previous) => ({ ...previous, [question.id]: event.target.value }))}
                placeholder="Tulis jawaban"
                className="min-h-[48px] flex-1 rounded-xl border border-line bg-white px-3.5 text-sm text-ink outline-none focus:border-brand disabled:bg-slate-50"
              />
              {!revealed && (
                <Button type="submit" disabled={busy || (drafts[question.id] ?? '').trim() === ''}>
                  Periksa jawaban
                </Button>
              )}
            </form>
            {check && (
              <p className="text-sm text-muted">
                Jawaban yang diterima: <span className="font-semibold text-ink">{check.kunci}</span>
              </p>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <form onSubmit={submitText} className="flex flex-col gap-2">
              <textarea
                aria-label="Jawaban esai"
                rows={4}
                value={revealed ? (answer ?? '') : (drafts[question.id] ?? '')}
                disabled={revealed || busy}
                onChange={(event) => setDrafts((previous) => ({ ...previous, [question.id]: event.target.value }))}
                placeholder="Tulis jawaban dalam 3 sampai 6 kalimat"
                className="rounded-xl border border-line bg-white p-3 text-sm leading-relaxed text-ink outline-none focus:border-brand disabled:bg-slate-50"
              />
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-muted">{wordCount(revealed ? (answer ?? '') : (drafts[question.id] ?? ''))} kata</span>
                {!revealed && (
                  <Button type="submit" disabled={busy || (drafts[question.id] ?? '').trim() === ''}>
                    Kirim jawaban
                  </Button>
                )}
              </div>
            </form>
            {essayAnswered && (
              <p className="rounded-lg bg-canvas p-2.5 text-sm text-muted">Tersimpan. Dinilai saat kuis dikumpulkan.</p>
            )}
          </div>
        )}

        {error && (
          <p role="alert" className="text-sm text-red-700">
            {error}
          </p>
        )}

        {check && (check.pembahasan ? (
          <section aria-label="Pembahasan" className="rounded-[14px] bg-brand-soft p-3.5">
            <h2 className="text-[13px] font-semibold text-brand-dark">Pembahasan</h2>
            <div className="mt-1 text-sm text-ink">
              <RichText content={check.pembahasan} />
            </div>
          </section>
        ) : (
          <section
            aria-label="Pembahasan terkunci"
            className="flex flex-wrap items-center justify-between gap-2 rounded-[14px] border border-line bg-slate-50 p-3"
          >
            <p className="text-sm text-muted">Pembahasan tersedia setelah masuk.</p>
            <Button variant="secondary" onClick={() => navigate('/masuk')}>
              Masuk
            </Button>
          </section>
        ))}

        <div className="flex items-center justify-between gap-2">
          <Button variant="secondary" aria-pressed={flagged[question.id] ?? false} onClick={toggleFlag}>
            {flagged[question.id] ? 'Ditandai ragu' : 'Tandai ragu'}
          </Button>
          <Button disabled={!revealed || busy} onClick={goNext}>
            {index < total - 1 ? 'Soal berikutnya' : 'Lihat hasil'}
          </Button>
        </div>
      </div>
    </section>
  )
}

interface QuestionCardProps {
  question: QuizQuestionView
  stimulusText: string | null
}

function QuestionCard({ question, stimulusText }: QuestionCardProps) {
  return (
    <article className="rounded-[14px] border border-line bg-canvas p-3.5 text-[14px] leading-7 text-ink">
      <p className="mb-2 text-xs font-semibold text-muted">{QUESTION_TYPE_LABEL[question.type]}</p>
      {stimulusText && (
        <details open className="mb-3 rounded-lg border border-line bg-white p-3">
          <summary className="cursor-pointer text-xs font-semibold text-muted">Teks bacaan</summary>
          <div className="mt-2">
            <RichText content={stimulusText} />
          </div>
        </details>
      )}
      <RichText content={question.prompt} />
    </article>
  )
}

interface FeedbackBadgeProps {
  score: number
  choice: boolean
}

function FeedbackBadge({ score, choice }: FeedbackBadgeProps) {
  const label = score === 100 ? 'Jawabanmu benar' : choice ? 'Pilihanmu salah' : `Nilai ${score}`
  return (
    <span
      className={clsx(
        'whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold',
        score === 100 ? 'bg-green-50 text-green-800' : score > 0 ? 'bg-[#FFFBEB] text-[#92400E]' : 'bg-red-50 text-red-800',
      )}
    >
      {label}
    </span>
  )
}
