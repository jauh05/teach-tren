import clsx from 'clsx'
import { Maximize2, Minimize2, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { QuizSettings } from '../../domain/quiz'
import { QuizSession } from './QuizSession'

interface ChatQuizPanelProps {
  quizId: string
  settings: QuizSettings
  onExit: () => void
}

// A quiz shown in place of the chat thread. It can grow to full screen and shrink back.
export function ChatQuizPanel({ quizId, settings, onExit }: ChatQuizPanelProps) {
  const [expanded, setExpanded] = useState(false)

  // Escape shrinks a full-screen quiz first. A second Escape does nothing, so the quiz stays open.
  useEffect(() => {
    if (!expanded) {
      return
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setExpanded(false)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [expanded])

  return (
    <section
      aria-label="Kuis"
      className={clsx('flex min-h-0 flex-1 flex-col bg-white', expanded && 'fixed inset-0 z-50')}
    >
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-line px-3 py-2">
        <p className="text-sm font-semibold text-ink">Kuis di chat</p>
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label={expanded ? 'Kecilkan kuis' : 'Perbesar kuis'}
            onClick={() => setExpanded((value) => !value)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-slate-50 hover:text-ink"
          >
            {expanded ? <Minimize2 size={16} aria-hidden="true" /> : <Maximize2 size={16} aria-hidden="true" />}
          </button>
          <button
            type="button"
            aria-label="Tutup kuis"
            onClick={onExit}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-slate-50 hover:text-ink"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>
      </div>
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        <QuizSession quizId={quizId} settings={settings} onExit={onExit} />
      </div>
    </section>
  )
}
