import { useMutation, useQueryClient } from '@tanstack/react-query'
import clsx from 'clsx'
import { Check, X } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { recordTopicScore } from '../../api/topics'
import { RichText } from '../../components/markdown/RichText'
import { Button } from '../../components/ui/Button'
import { progressStates, scoreQuiz, type Answers, type ProgressState, type Quiz } from '../../domain/quiz'
import { useSessionStore } from '../../stores/sessionStore'
import { QuizResult } from './QuizResult'

const SEGMENT_CLASS: Record<ProgressState, string> = {
  correct: 'bg-status-kuasai',
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

// One question per screen. Feedback appears after an answer. Guests do not see the explanation (docs/role.md 4.4).
export function QuizRunner({ quiz }: QuizRunnerProps) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const mode = useSessionStore((state) => state.mode)
  const recordGuestAction = useSessionStore((state) => state.recordGuestAction)
  const isGuest = mode === 'guest'

  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<Answers>({})
  const [flagged, setFlagged] = useState<Record<string, boolean>>({})
  const [finished, setFinished] = useState(false)

  const saveScore = useMutation({
    mutationFn: (percent: number) => recordTopicScore(quiz.id, percent),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['topics'] }),
  })

  const total = quiz.questions.length
  const question = quiz.questions[index]
  if (!question) {
    return <p className="p-6 text-sm text-muted">Kuis ini belum memiliki soal.</p>
  }

  const score = scoreQuiz(quiz.questions, answers)
  const states = progressStates(quiz.questions, answers, index)
  const chosen = answers[question.id]
  const revealed = chosen !== undefined
  const stimulus = quiz.stimuli.find((item) => item.id === question.stimulusId)

  if (finished) {
    return (
      <QuizResult
        quiz={quiz}
        answers={answers}
        isGuest={isGuest}
        onRestart={() => {
          setIndex(0)
          setAnswers({})
          setFlagged({})
          setFinished(false)
        }}
      />
    )
  }

  function choose(letter: string) {
    if (revealed) {
      return
    }
    setAnswers((previous) => ({ ...previous, [question.id]: letter }))
  }

  function goNext() {
    if (index < total - 1) {
      setIndex(index + 1)
      return
    }
    // A finished quiz uses one guest action. Signed-in users save the score instead.
    if (isGuest) {
      recordGuestAction()
    } else {
      saveScore.mutate(score.percent)
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
            </p>
          </div>
          {revealed && <FeedbackBadge correct={chosen === question.answer} />}
        </div>

        <div role="img" aria-label={`Progres: ${correctCount} benar, ${wrongCount} salah`} className="flex gap-1.5">
          {states.map((state, position) => (
            <span
              key={quiz.questions[position].id}
              className={clsx('h-[5px] flex-1 rounded-full', SEGMENT_CLASS[state])}
            />
          ))}
        </div>

        <article className="rounded-[14px] border border-line bg-canvas p-3.5 text-[14px] leading-7 text-ink">
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

        <ul className="flex flex-col gap-2">
          {question.options.map((option) => {
            const picked = chosen === option.letter
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

function FeedbackBadge({ correct }: { correct: boolean }) {
  return (
    <span
      className={clsx(
        'whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold',
        correct ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800',
      )}
    >
      {correct ? 'Jawabanmu benar' : 'Pilihanmu salah'}
    </span>
  )
}
