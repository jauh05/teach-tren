import { Dialog } from '../../components/ui/Dialog'
import { useUiStore } from '../../stores/uiStore'
import { QuizSetupCards, QuizSetupSummary } from './QuizSetup'
import { useQuizSetupDraft, useQuizSourceName } from './quizSetupDraft'

// Atur kuis as a pop-up. Mounted once in App so Learning and Chat can open it.
export function QuizSetupDialog() {
  const quizId = useUiStore((state) => state.quizSetupFor)
  if (quizId === null) {
    return null
  }
  // Keyed by quiz so the choices start fresh each time the pop-up opens.
  return <QuizSetupModal key={quizId} quizId={quizId} />
}

interface QuizSetupModalProps {
  quizId: string
}

// Starting the quiz runs it inside the chat it was opened from, not on a separate page.
function QuizSetupModal({ quizId }: QuizSetupModalProps) {
  const closeQuizSetup = useUiStore((state) => state.closeQuizSetup)
  const startChatQuiz = useUiStore((state) => state.startChatQuiz)
  const draft = useQuizSetupDraft()
  const sourceName = useQuizSourceName(quizId)

  function start() {
    closeQuizSetup()
    startChatQuiz({ quizId, settings: { count: draft.count, level: draft.level, style: draft.style } })
  }

  return (
    <Dialog
      open
      title="Atur kuis"
      description={`Kuis dari ${sourceName}`}
      size="lg"
      onClose={closeQuizSetup}
      footer={
        <div className="bg-white px-5 py-3">
          <QuizSetupSummary draft={draft} onStart={start} />
        </div>
      }
    >
      <QuizSetupCards draft={draft} />
    </Dialog>
  )
}
