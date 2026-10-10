import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSessionStore } from '../../stores/sessionStore'
import { Composer } from './Composer'

const SUGGESTIONS = [
  'Jelaskan persamaan linear dengan contoh',
  'Buatkan 3 soal Bangun Datar',
  'Ringkas fotosintesis dalam 5 poin',
  'Apa beda sel hewan dan sel tumbuhan?',
]

// Chat home (docs/design/html/01-chat-beranda-*.html). Sends the first message to a new conversation.
export function ChatHomePage() {
  const navigate = useNavigate()
  const firstName = useSessionStore((state) => state.account.name.split(' ')[0])
  const [draft, setDraft] = useState('')

  function startChat(message: string) {
    const text = message.trim()
    if (text === '') {
      return
    }
    navigate('/c/baru', { state: { message: text } })
  }

  return (
    <section className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-1 flex-col items-center justify-center overflow-y-auto px-4 py-6 md:px-6">
        <p className="text-sm text-muted">Halo, {firstName}</p>
        <h1 className="mb-5 mt-1 text-center font-heading text-2xl font-semibold text-ink md:mb-[22px] md:text-[28px]">
          Mau belajar apa hari ini?
        </h1>

        <div className="w-full max-w-[520px]">
          <Composer value={draft} onChange={setDraft} onSubmit={() => startChat(draft)} />
        </div>

        <ul className="mt-4 flex max-w-[520px] flex-wrap justify-center gap-2">
          {SUGGESTIONS.map((suggestion) => (
            <li key={suggestion}>
              <button
                type="button"
                onClick={() => startChat(suggestion)}
                className="rounded-full border border-line bg-white px-3.5 py-2 text-left text-[13px] text-ink hover:bg-slate-50"
              >
                {suggestion}
              </button>
            </li>
          ))}
        </ul>
      </div>
      <p className="pb-3.5 text-center text-xs text-muted">Riwayat Anda tersimpan di akun.</p>
    </section>
  )
}
