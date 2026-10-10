import { ArrowUp, Lock, Plus, Square } from 'lucide-react'
import type { KeyboardEvent } from 'react'
import { Link } from 'react-router-dom'

interface ComposerProps {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  placeholder?: string
  // While an answer streams, the send button becomes a stop button.
  streaming?: boolean
  onStop?: () => void
  // Locked replaces the message box for guests who used their free actions (docs/role.md 2.3).
  locked?: boolean
  lockedMessage?: string
}

// Message box. Enter sends, Shift+Enter adds a line (docs/role.md CC-05).
export function Composer({
  value,
  onChange,
  onSubmit,
  placeholder = 'Tanyakan materi, minta soal latihan, atau unggah catatan',
  streaming = false,
  onStop,
  locked = false,
  lockedMessage = 'Untuk lanjut, daftar atau masuk dulu.',
}: ComposerProps) {
  const canSend = value.trim().length > 0

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault()
      if (canSend && !streaming) {
        onSubmit()
      }
    }
  }

  if (locked) {
    return (
      <div className="flex w-full items-center gap-2.5 rounded-[20px] border border-line bg-slate-50 px-4 py-3.5 text-sm text-muted">
        <Lock size={16} aria-hidden="true" />
        <span>{lockedMessage}</span>
      </div>
    )
  }

  return (
    <div className="w-full rounded-[20px] border border-[#CBD5E1] bg-white px-4 pb-2.5 pt-3.5 shadow-sm">
      <textarea
        aria-label="Tulis pertanyaan"
        rows={2}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={handleKeyDown}
        className="max-h-40 min-h-[44px] w-full resize-none bg-transparent text-[14px] leading-relaxed text-ink outline-none placeholder:text-muted"
      />
      <div className="flex items-center justify-between">
        <Link to="/materi" className="flex items-center gap-1 text-[13px] text-muted hover:text-ink">
          <Plus size={14} aria-hidden="true" />
          Lampiran
        </Link>
        {streaming ? (
          <button
            type="button"
            aria-label="Hentikan jawaban"
            onClick={onStop}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-ink text-white"
          >
            <Square size={14} aria-hidden="true" />
          </button>
        ) : (
          <button
            type="button"
            aria-label="Kirim pesan"
            disabled={!canSend}
            onClick={onSubmit}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-white transition-colors hover:bg-brand-dark disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            <ArrowUp size={18} aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  )
}
