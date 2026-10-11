import { useParams, useSearchParams } from 'react-router-dom'
import { parseQuizSettings } from '../../domain/quiz'
import { useSessionStore } from '../../stores/sessionStore'
import { QuizSession } from './QuizSession'

// Quiz (/kuis/:quizId). Settings come from the Atur page as query parameters.
// The id is a topic id or a conversation id. Quizzes started from a chat run inside that chat instead.
export function QuizPage() {
  const { quizId = '' } = useParams()
  const [params] = useSearchParams()
  const isGuest = useSessionStore((state) => state.mode === 'guest')
  const settings = parseQuizSettings(params, isGuest)
  return <QuizSession quizId={quizId} settings={settings} />
}
