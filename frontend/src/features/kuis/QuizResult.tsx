import { Check, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { RichText } from '../../components/markdown/RichText'
import { Button } from '../../components/ui/Button'
import { gradeEssay } from '../../domain/penilaian'
import {
  isChoiceQuestion,
  QUESTION_TYPE_LABEL,
  scoreQuestion,
  scoreQuiz,
  type Answers,
  type Quiz,
  type QuizQuestion,
} from '../../domain/quiz'

interface QuizResultProps {
  quiz: Quiz
  questions: QuizQuestion[]
  answers: Answers
  isGuest: boolean
  // True when this run only repeats the wrong questions. Such a run does not change the saved score.
  retry: boolean
  onRestart: () => void
  onRetryWrong: () => void
  // Set when the quiz runs inside a chat. Returns to that chat.
  onExit?: () => void
}

// Final screen: score, one row per question with the answer and explanation, and the next actions.
export function QuizResult({
  quiz,
  questions,
  answers,
  isGuest,
  retry,
  onRestart,
  onRetryWrong,
  onExit,
}: QuizResultProps) {
  const navigate = useNavigate()
  const score = scoreQuiz(questions, answers)
  const wrongCount = questions.filter((question) => scoreQuestion(question, answers[question.id]) < 100).length

  return (
    <section className="mx-auto flex w-full max-w-[720px] flex-col gap-4 px-4 py-6 md:px-6">
      <div className="rounded-[14px] border border-line bg-white p-5 text-center">
        <p className="text-xs text-muted">{retry ? 'Hasil ulang soal salah' : 'Skor kuis'}</p>
        <p className="font-heading text-4xl font-semibold text-ink">{score.percent}%</p>
        <p className="text-sm text-muted">
          {score.correct} dari {score.total} soal benar penuh
        </p>
        <p className="mt-3 text-sm text-ink">
          {isGuest
            ? 'Hasil hanya tersimpan di perangkat ini. Masuk untuk menyimpan skor dan melihat pembahasan.'
            : retry
              ? 'Hasil ulang tidak mengubah skor yang tersimpan.'
              : `Skor masuk riwayat dan memperbarui status bulat ${quiz.topicName}.`}
        </p>
      </div>

      <ol className="flex flex-col gap-2">
        {questions.map((question, position) => {
          const questionScore = scoreQuestion(question, answers[question.id])
          const correct = questionScore === 100
          return (
            <li key={question.id} className="rounded-[12px] border border-line bg-white px-4 py-3">
              <details>
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 [&::-webkit-details-marker]:hidden">
                  <span className="flex min-w-0 items-center gap-2 text-sm text-ink">
                    <span className="shrink-0 text-muted">Soal {position + 1}</span>
                    <span className="truncate text-xs text-muted">{QUESTION_TYPE_LABEL[question.type]}</span>
                  </span>
                  <span
                    className={
                      correct
                        ? 'flex shrink-0 items-center gap-1 text-xs font-semibold text-green-700'
                        : 'flex shrink-0 items-center gap-1 text-xs font-semibold text-red-700'
                    }
                  >
                    {correct ? <Check size={14} aria-hidden="true" /> : <X size={14} aria-hidden="true" />}
                    {correct ? 'Benar' : `Nilai ${questionScore}`}
                  </span>
                </summary>
                <div className="mt-3 flex flex-col gap-2 border-t border-line pt-3 text-sm text-ink">
                  <QuestionDetail question={question} answer={answers[question.id]} />
                  {isGuest ? (
                    <p className="text-xs text-muted">Pembahasan tersedia setelah masuk.</p>
                  ) : (
                    <div className="rounded-lg bg-soft p-3">
                      <p className="text-xs font-semibold text-brand-dark">Pembahasan</p>
                      <div className="mt-1">
                        <RichText content={question.explanation} />
                      </div>
                    </div>
                  )}
                </div>
              </details>
            </li>
          )
        })}
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
        {onExit ? (
          <Button onClick={onExit}>Kembali ke chat</Button>
        ) : (
          <Button onClick={() => navigate('/learning')}>Kembali ke Learning</Button>
        )}
      </div>
    </section>
  )
}

interface QuestionDetailProps {
  question: QuizQuestion
  answer: string | undefined
}

// The user's answer next to what was expected, by question type.
function QuestionDetail({ question, answer }: QuestionDetailProps) {
  if (isChoiceQuestion(question)) {
    const correctOption = question.options.find((option) => option.letter === question.answer)
    return (
      <p>
        Pilihanmu: <span className="font-semibold">{answer ? `${answer}` : 'belum dijawab'}</span>. Jawaban benar:{' '}
        <span className="font-semibold">
          {question.answer}
          {correctOption ? ` (${correctOption.text})` : ''}
        </span>
      </p>
    )
  }
  if (question.type === 'ISIAN') {
    return (
      <p>
        Jawabanmu: <span className="font-semibold">{answer ?? 'belum dijawab'}</span>. Jawaban yang diterima:{' '}
        <span className="font-semibold">{question.acceptedAnswers[0]}</span>
      </p>
    )
  }
  const grade = gradeEssay(answer ?? '', question.rubric)
  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs text-muted">Jawabanmu</p>
      <p className="whitespace-pre-wrap rounded-lg bg-canvas p-2.5">{answer ?? 'belum dijawab'}</p>
      <ul className="mt-1 flex flex-col gap-1">
        {grade.results.map((item) => (
          <li key={item.point} className="flex justify-between gap-2 text-xs">
            <span>{item.point}</span>
            <span className={item.earned ? 'font-semibold text-green-700' : 'font-semibold text-red-700'}>
              {item.earned ? 'Ada' : 'Belum ada'} · bobot {item.weight}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
