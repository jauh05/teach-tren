import { useMutation, useQueryClient } from '@tanstack/react-query'
import clsx from 'clsx'
import { Check, X } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { recordTopicScore } from '../../api/topics'
import { RichText } from '../../components/markdown/RichText'
import { Button } from '../../components/ui/Button'
import { gradeEssay, wordCount } from '../../domain/penilaian'
import {
  isChoiceQuestion,
  progressStates,
  QUESTION_TYPE_LABEL,
  scoreQuestion,
  scoreQuiz,
  type Answers,
  type ProgressState,
  type Quiz,
  type QuizQuestion,
} from '../../domain/quiz'
import { useSessionStore } from '../../stores/sessionStore'
import { QuizResult } from './QuizResult'

const SEGMENT_CLASS: Record<ProgressState, string> = {
  correct: 'bg-status-kuasai',
  partial: 'bg-status-sedang',
  wrong: 'bg-status-ulang',
  current: 'bg-brand',
  pending: 'bg-line',
}

type OptionTone = 'idle' | 'correct' | 'wrong'

const OPTION_CLASS: Record<OptionTone, string> = {
  idle: 'border-line bg-white',
  correct: 'border-status-kuasai bg-[#F0FDF4]',
  wrong: 'border-status-ulang bg-[#FEF2F2]',
}

interface QuizRunnerProps {
  quiz: Quiz
}

// One question per screen. Feedback appears after each answer. Guests do not see the explanation (docs/role.md 4.4).
// Fill-in and essay answers are typed, then checked or sent. Essays are graded against a rubric.
export function QuizRunner({ quiz }: QuizRunnerProps) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const mode = useSessionStore((state) => state.mode)
  const recordGuestAction = useSessionStore((state) => state.recordGuestAction)
  const isGuest = mode === 'guest'

  // Questions in this run. A retry run contains only the questions answered wrong.
  const [questions, setQuestions] = useState<QuizQuestion[]>(quiz.questions)
  const [retry, setRetry] = useState(false)
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<Answers>({})
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [flagged, setFlagged] = useState<Record<string, boolean>>({})
  const [finished, setFinished] = useState(false)

  const saveScore = useMutation({
    mutationFn: (percent: number) => recordTopicScore(quiz.id, percent),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['topics'] }),
  })

  const total = questions.length
  const question = questions[index]
  if (!question) {
    return <p className="p-6 text-sm text-muted">Kuis ini belum memiliki soal.</p>
  }

  const score = scoreQuiz(questions, answers)
  const states = progressStates(questions, answers, index)
  const answer = answers[question.id]
  const revealed = answer !== undefined
  const questionScore = scoreQuestion(question, answer)
  const stimulus = quiz.stimuli.find((item) => item.id === question.stimulusId)

  function restart(nextQuestions: QuizQuestion[], nextRetry: boolean) {
    setQuestions(nextQuestions)
    setRetry(nextRetry)
    setIndex(0)
    setAnswers({})
    setDrafts({})
    setFlagged({})
    setFinished(false)
  }

  if (finished) {
    const wrong = questions.filter((item) => scoreQuestion(item, answers[item.id]) < 100)
    return (
      <QuizResult
        quiz={quiz}
        questions={questions}
        answers={answers}
        isGuest={isGuest}
        retry={retry}
        onRestart={() => restart(quiz.questions, false)}
        onRetryWrong={() => restart(wrong, true)}
      />
    )
  }

  function choose(letter: string) {
    if (revealed) {
      return
    }
    setAnswers((previous) => ({ ...previous, [question.id]: letter }))
  }

  // Fill-in and essay answers are committed on submit, then feedback is shown.
  function submitText(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const text = (drafts[question.id] ?? '').trim()
    if (text === '' || revealed) {
      return
    }
    setAnswers((previous) => ({ ...previous, [question.id]: text }))
  }

  function goNext() {
    if (index < total - 1) {
      setIndex(index + 1)
      return
    }
    // The first full run decides the saved score and uses one guest action. Retry runs change neither.
    if (!retry) {
      if (isGuest) {
        recordGuestAction()
      } else {
        saveScore.mutate(score.percent)
      }
    }
    setFinished(true)
  }

  function toggleFlag() {
    setFlagged((previous) => ({ ...previous, [question.id]: !previous[question.id] }))
  }

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
              {retry && <span className="ml-2 text-xs font-normal text-muted">ulangi soal salah</span>}
            </p>
          </div>
          {revealed && <FeedbackBadge score={questionScore} choice={isChoiceQuestion(question)} />}
        </div>

        <div role="img" aria-label={`Progres: ${correctCount} benar, ${wrongCount} salah`} className="flex gap-1.5">
          {states.map((state, position) => (
            <span key={questions[position].id} className={clsx('h-[5px] flex-1 rounded-full', SEGMENT_CLASS[state])} />
          ))}
        </div>

        <article className="rounded-[14px] border border-line bg-canvas p-3.5 text-[14px] leading-7 text-ink">
          <p className="mb-2 text-xs font-semibold text-muted">{QUESTION_TYPE_LABEL[question.type]}</p>
          {stimulus && (
            <details open className="mb-3 rounded-lg border border-line bg-white p-3">
              <summary className="cursor-pointer text-xs font-semibold text-muted">Teks bacaan</summary>
              <div className="mt-2">
                <RichText content={stimulus.text} />
              </div>
            </details>
          )}
          <RichText content={question.prompt} />
        </article>

        {isChoiceQuestion(question) ? (
          <ul className="flex flex-col gap-2">
            {question.options.map((option) => {
              const picked = answer === option.letter
              const tone: OptionTone = !revealed
                ? 'idle'
                : option.letter === question.answer
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
                    disabled={revealed}
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
                value={revealed ? answer : (drafts[question.id] ?? '')}
                disabled={revealed}
                onChange={(event) => setDrafts((previous) => ({ ...previous, [question.id]: event.target.value }))}
                placeholder="Tulis jawaban"
                className="min-h-[48px] flex-1 rounded-xl border border-[#CBD5E1] bg-white px-3.5 text-sm text-ink outline-none focus:border-brand disabled:bg-slate-50"
              />
              {!revealed && (
                <Button type="submit" disabled={(drafts[question.id] ?? '').trim() === ''}>
                  Periksa jawaban
                </Button>
              )}
            </form>
            {revealed && (
              <p className="text-sm text-muted">
                Jawaban yang diterima: <span className="font-semibold text-ink">{question.acceptedAnswers[0]}</span>
              </p>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <form onSubmit={submitText} className="flex flex-col gap-2">
              <textarea
                aria-label="Jawaban esai"
                rows={4}
                value={revealed ? answer : (drafts[question.id] ?? '')}
                disabled={revealed}
                onChange={(event) => setDrafts((previous) => ({ ...previous, [question.id]: event.target.value }))}
                placeholder="Tulis jawaban dalam 3 sampai 6 kalimat"
                className="rounded-xl border border-[#CBD5E1] bg-white p-3 text-sm leading-relaxed text-ink outline-none focus:border-brand disabled:bg-slate-50"
              />
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-muted">{wordCount(revealed ? answer : (drafts[question.id] ?? ''))} kata</span>
                {!revealed && (
                  <Button type="submit" disabled={(drafts[question.id] ?? '').trim() === ''}>
                    Kirim jawaban
                  </Button>
                )}
              </div>
            </form>
            {revealed && <RubricFeedback answer={answer} rubric={question.type === 'ESAI' ? question.rubric : []} />}
          </div>
        )}

        {revealed &&
          (isGuest ? (
            <section
              aria-label="Pembahasan terkunci"
              className="flex flex-wrap items-center justify-between gap-2 rounded-[14px] border border-line bg-slate-50 p-3"
            >
              <p className="text-sm text-muted">Pembahasan tersedia setelah masuk.</p>
              <Button variant="secondary" onClick={() => navigate('/masuk')}>
                Masuk
              </Button>
            </section>
          ) : (
            <section aria-label="Pembahasan" className="rounded-[14px] bg-soft p-3.5">
              <h2 className="text-[13px] font-semibold text-brand-dark">Pembahasan</h2>
              <div className="mt-1 text-sm text-ink">
                <RichText content={question.explanation} />
              </div>
            </section>
          ))}

        <div className="flex items-center justify-between gap-2">
          <Button variant="secondary" aria-pressed={flagged[question.id] ?? false} onClick={toggleFlag}>
            {flagged[question.id] ? 'Ditandai ragu' : 'Tandai ragu'}
          </Button>
          <Button disabled={!revealed} onClick={goNext}>
            {index < total - 1 ? 'Soal berikutnya' : 'Lihat hasil'}
          </Button>
        </div>
      </div>
    </section>
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

interface RubricFeedbackProps {
  answer: string
  rubric: { point: string; keywords: string[]; weight: number }[]
}

// Shows which rubric points the essay covered. Short or incomplete essays are marked for review.
function RubricFeedback({ answer, rubric }: RubricFeedbackProps) {
  if (rubric.length === 0) {
    return null
  }
  const grade = gradeEssay(answer, rubric)
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-line bg-white p-3">
      <p className="text-sm font-semibold text-ink">Nilai esai: {grade.score}</p>
      <ul className="flex flex-col gap-1">
        {grade.results.map((item) => (
          <li key={item.point} className="flex items-center justify-between gap-2 text-sm">
            <span className="text-ink">{item.point}</span>
            <span className={item.earned ? 'text-xs font-semibold text-green-700' : 'text-xs font-semibold text-red-700'}>
              {item.earned ? 'Ada' : 'Belum ada'} · bobot {item.weight}
            </span>
          </li>
        ))}
      </ul>
      {grade.lowConfidence && (
        <p className="text-xs text-[#92400E]">Jawaban masih singkat atau belum memuat banyak poin. Ditandai untuk ditinjau.</p>
      )}
    </div>
  )
}
