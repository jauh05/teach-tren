import { Check, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { scoreQuiz, type Answers, type Quiz } from '../../domain/quiz'

interface QuizResultProps {
  quiz: Quiz
  answers: Answers
  isGuest: boolean
  onRestart: () => void
}

// Final screen: score, per-question result, and the next actions.
export function QuizResult({ quiz, answers, isGuest, onRestart }: QuizResultProps) {
  const navigate = useNavigate()
  const score = scoreQuiz(quiz.questions, answers)

  return (
    <section className="mx-auto flex w-full max-w-[720px] flex-col gap-4 px-4 py-6 md:px-6">
      <div className="rounded-[14px] border border-line bg-white p-5 text-center">
        <p className="text-xs text-muted">Skor kuis</p>
        <p className="font-heading text-4xl font-semibold text-ink">{score.percent}%</p>
        <p className="text-sm text-muted">
          {score.correct} dari {score.total} soal benar
        </p>
        <p className="mt-3 text-sm text-ink">
          {isGuest
            ? 'Hasil hanya tersimpan di perangkat ini. Masuk untuk menyimpan skor dan melihat pembahasan.'
            : `Skor masuk riwayat dan memperbarui status bulat ${quiz.topicName}.`}
        </p>
      </div>

      <ol className="flex flex-col gap-1.5">
        {quiz.questions.map((question, position) => {
          const correct = answers[question.id] === question.answer
          const Icon = correct ? Check : X
          return (
            <li
              key={question.id}
              className="flex items-center justify-between gap-3 rounded-[10px] border border-line bg-slate-50 px-3 py-2 text-sm text-ink"
            >
              <span>Soal {position + 1}</span>
              <span
                className={correct ? 'flex items-center gap-1 text-xs font-semibold text-green-700' : 'flex items-center gap-1 text-xs font-semibold text-red-700'}
              >
                <Icon size={14} aria-hidden="true" />
                {correct ? 'Benar' : 'Salah'}
              </span>
            </li>
          )
        })}
      </ol>

      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" onClick={onRestart}>
          Ulangi kuis
        </Button>
        <Button onClick={() => navigate('/learning')}>Kembali ke Learning</Button>
      </div>
    </section>
  )
}
