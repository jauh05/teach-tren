import { useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { fetchQuiz } from '../../api/quizzes'
import { QuizRunner } from './QuizRunner'

// Quiz (/kuis/:quizId). The id is a topic id or a conversation id.
export function QuizPage() {
  const { quizId = '' } = useParams()
  const { data, isPending, isError } = useQuery({
    queryKey: ['quiz', quizId],
    queryFn: () => fetchQuiz(quizId),
  })

  if (isPending) {
    return <p className="p-6 text-sm text-muted">Memuat kuis...</p>
  }

  if (isError) {
    return (
      <p role="alert" className="p-6 text-sm text-red-700">
        Kuis belum bisa dimuat. Coba muat ulang halaman.
      </p>
    )
  }

  return <QuizRunner key={quizId} quiz={data} />
}
