import { ClipboardList, Copy, Plus, RotateCcw } from 'lucide-react'
import type { ChatMessage } from '../../domain/types'
import { RichText } from '../../components/markdown/RichText'

interface MessageBubbleProps {
  message: ChatMessage
  onCopy: () => void
  onRegenerate: () => void
  onCreateQuiz: () => void
  // Only for signed-in users. Guests have no topics.
  onMakeTopic?: () => void
}

// One message. User messages are bubbles on the right. Assistant messages are plain text on the left.
export function MessageBubble({ message, onCopy, onRegenerate, onCreateQuiz, onMakeTopic }: MessageBubbleProps) {
  if (message.role === 'user') {
    return (
      <div className="flex max-w-[70%] flex-col items-end gap-1 self-end">
        <div className="whitespace-pre-wrap rounded-2xl border border-line bg-white px-4 py-2.5 text-[14px] text-ink shadow-sm">{message.content}</div>
        {onMakeTopic && <ActionButton icon={Plus} label="Jadikan bulat" onClick={onMakeTopic} />}
      </div>
    )
  }

  const finished = message.status === 'done'

  return (
    <div className="flex max-w-[92%] flex-col gap-2 self-start">
      <div className="rounded-2xl bg-brand-soft px-4 py-3.5 text-[14px] leading-7 text-ink">
        {message.status === 'streaming' ? (
          <div className="whitespace-pre-wrap">
            {message.content}
            <span aria-hidden="true" className="ml-0.5 inline-block h-4 w-[2px] animate-pulse bg-brand align-middle" />
          </div>
        ) : (
          <RichText content={message.content} />
        )}
      </div>

      {message.status === 'stopped' && <p className="text-xs text-muted">Jawaban dihentikan.</p>}

      {finished && (
        <div className="flex flex-wrap gap-1">
          <ActionButton icon={Copy} label="Salin" onClick={onCopy} />
          <ActionButton icon={RotateCcw} label="Ulangi" onClick={onRegenerate} />
          <ActionButton icon={ClipboardList} label="Buat latihan" onClick={onCreateQuiz} />
        </div>
      )}
    </div>
  )
}

interface ActionButtonProps {
  icon: typeof Copy
  label: string
  onClick: () => void
}

function ActionButton({ icon: Icon, label, onClick }: ActionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg px-2 text-xs text-muted hover:bg-slate-50 hover:text-ink md:min-h-[32px]"
    >
      <Icon size={14} aria-hidden="true" />
      {label}
    </button>
  )
}
