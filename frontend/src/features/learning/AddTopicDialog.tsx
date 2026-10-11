import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Lock } from 'lucide-react'
import { useId, useState } from 'react'
import { Link } from 'react-router-dom'
import { ApiError } from '../../api/http'
import { createTopic, fetchTopicGraph, linkTopics, suggestPatterns, type PatternSuggestion } from '../../api/topics'
import { Button } from '../../components/ui/Button'
import { Dialog } from '../../components/ui/Dialog'
import { topicStatusOf } from '../../domain/topicStatus'
import { useSessionStore } from '../../stores/sessionStore'

interface CreatedTopic {
  id: string
  name: string
}

interface AddTopicDialogProps {
  open: boolean
  // A guest who already holds the one topic of the device sees the sign-in prompt instead of the form.
  locked: boolean
  onClose: () => void
  // Called with the id of the new topic, so the canvas can select it.
  onCreated: (topicId: string) => void
}

// Adds a pattern (pola belajar). The user says what they want to learn, and the AI proposes three patterns.
// After a pattern is added, the user chooses what comes next.
export function AddTopicDialog({ open, locked, onClose, onCreated }: AddTopicDialogProps) {
  const [created, setCreated] = useState<CreatedTopic | null>(null)
  const [panel, setPanel] = useState<'menu' | 'ai' | 'selesai'>('menu')
  const queryClient = useQueryClient()

  function close() {
    setCreated(null)
    setPanel('menu')
    onClose()
  }

  // The topic exists now, so the next step opens.
  async function finishCreate(topicId: string, name: string) {
    await queryClient.invalidateQueries({ queryKey: ['topics'] })
    setCreated({ id: topicId, name })
    onCreated(topicId)
  }

  if (locked && !created) {
    return (
      <Dialog open={open} title="Tambah belajar" description="Bulat dari perangkat ini sudah dibuat." onClose={close}>
        <div className="flex flex-col gap-3">
          <p className="text-sm text-muted">
            Masuk untuk membuat bulat lagi. Bulat dari perangkat ini ikut pindah ke akunmu.
          </p>
          <Link
            to="/masuk?redirect=%2Flearning"
            className="inline-flex min-h-[44px] items-center justify-center rounded-[10px] bg-brand px-3.5 text-[13px] font-semibold text-white hover:bg-brand-dark md:min-h-0 md:py-2"
          >
            Masuk
          </Link>
        </div>
      </Dialog>
    )
  }

  if (created) {
    return (
      <Dialog open={open} title="Pola berikutnya" description={`Pola “${created.name}” sudah ada di kanvas.`} onClose={close}>
        {panel === 'menu' && <NextMenu onChoose={setPanel} onDone={close} />}
        {panel === 'ai' && <NextAiPanel created={created} onBack={() => setPanel('menu')} onAdded={finishCreate} onDone={close} />}
        {panel === 'selesai' && <FinishedPanel created={created} onBack={() => setPanel('menu')} onDone={close} />}
      </Dialog>
    )
  }

  return (
    <Dialog open={open} title="Tambah belajar" description="Tulis tujuanmu. AI mengusulkan tiga pola belajar untuk dipilih." onClose={close}>
      <GoalPanel onAdded={finishCreate} />
    </Dialog>
  )
}

// Names of the account, or of the device for a guest. Used to avoid repeating a name.
function useTopicNames(): string[] {
  const graph = useQuery({ queryKey: ['topics'], queryFn: fetchTopicGraph })
  return (graph.data?.topics ?? []).map((topic) => topic.name)
}

interface GoalPanelProps {
  onAdded: (topicId: string, name: string) => Promise<void>
}

// The user says what they want to learn. The AI proposes three patterns, and each one is added only when chosen.
// A guest may do this once on the device. A second time asks for sign-in.
function GoalPanel({ onAdded }: GoalPanelProps) {
  const inputId = useId()
  const names = useTopicNames()
  const [goal, setGoal] = useState('')
  const [asked, setAsked] = useState<string | null>(null)
  const suggestions = useQuery({
    queryKey: ['pola-tujuan', asked],
    queryFn: () => suggestPatterns({ tujuan: asked ?? '', sudahAda: names }),
    enabled: asked !== null,
    retry: false,
    staleTime: Infinity,
  })
  const quotaUsed = suggestions.error instanceof ApiError && suggestions.error.code === 'KUOTA_HABIS'

  return (
    <div className="flex flex-col gap-3">
      <form
        onSubmit={(event) => {
          event.preventDefault()
          const value = goal.trim()
          if (value !== '') {
            setAsked(value)
          }
        }}
        className="flex flex-col gap-2"
      >
        <label htmlFor={inputId} className="text-sm font-semibold text-ink">
          Mau belajar apa?
        </label>
        <input
          id={inputId}
          type="text"
          maxLength={120}
          autoComplete="off"
          placeholder="Contoh: Aljabar linier SMA"
          value={goal}
          onChange={(event) => setGoal(event.target.value)}
          className="w-full rounded-lg border border-[#CBD5E1] bg-white px-3 py-2 text-sm text-ink outline-none focus:border-brand"
        />
        <div className="flex justify-end">
          <Button type="submit" disabled={goal.trim() === '' || suggestions.isFetching || quotaUsed}>
            Generate
          </Button>
        </div>
      </form>
      <SuggestionState query={suggestions} />
      {quotaUsed && (
        <Link to="/masuk?redirect=%2Flearning" className="text-sm font-semibold text-brand-dark underline">
          Masuk untuk membuat bulat lagi
        </Link>
      )}
      {suggestions.data && <SuggestionList items={suggestions.data} onAdd={(name, id) => onAdded(id, name)} />}
    </div>
  )
}

interface NextAiPanelProps {
  created: CreatedTopic
  onBack: () => void
  onAdded: (topicId: string, name: string) => Promise<void>
  onDone: () => void
}

// Patterns that follow the new one, from the AI. Only signed-in users reach this step.
function NextAiPanel({ created, onBack, onAdded, onDone }: NextAiPanelProps) {
  const suggestions = useQuery({
    queryKey: ['pola-saran', created.id],
    queryFn: () => suggestPatterns({ polaId: created.id }),
    retry: false,
    staleTime: Infinity,
  })

  return (
    <div className="flex flex-col gap-3">
      <SuggestionState query={suggestions} />
      {suggestions.data && (
        <SuggestionList items={suggestions.data} onAdd={(name, id) => onAdded(id, name)} linkFrom={created.id} />
      )}
      <PanelFooter onBack={onBack} onDone={onDone} />
    </div>
  )
}

// Back to the choices, or done. Done closes the dialog and keeps everything that was added.
function PanelFooter({ onBack, onDone }: { onBack: () => void; onDone: () => void }) {
  return (
    <div className="flex justify-between gap-2">
      <Button variant="secondary" onClick={onBack}>
        Kembali
      </Button>
      <Button variant="secondary" onClick={onDone}>
        Selesai
      </Button>
    </div>
  )
}

interface SuggestionStateProps {
  query: { isPending: boolean; isError: boolean; error: Error | null }
}

function SuggestionState({ query }: SuggestionStateProps) {
  if (query.isPending) {
    return <p className="text-sm text-muted">AI sedang menyusun usulan...</p>
  }
  if (query.isError) {
    return (
      <p role="alert" className="text-sm text-red-700">
        {query.error?.message ?? 'Usulan belum bisa dibuat. Coba lagi.'}
      </p>
    )
  }
  return null
}

interface SuggestionListProps {
  items: PatternSuggestion[]
  // Called after the pattern exists.
  onAdd: (name: string, id: string) => Promise<void>
  linkFrom?: string
}

// Each suggestion becomes a pattern only when the user adds it.
function SuggestionList({ items, onAdd, linkFrom }: SuggestionListProps) {
  const queryClient = useQueryClient()
  const [added, setAdded] = useState<string[]>([])
  const add = useMutation({
    mutationFn: async (name: string) => {
      const id = await createTopic(name, linkFrom)
      return { id, name }
    },
    onSuccess: async ({ id, name }) => {
      setAdded((current) => [...current, name])
      await queryClient.invalidateQueries({ queryKey: ['topics'] })
      await onAdd(name, id)
    },
  })

  return (
    <ul className="flex flex-col gap-2">
      {items.map((item) => {
        const done = added.includes(item.nama)
        return (
          <li key={item.nama} className="flex items-start justify-between gap-3 rounded-xl border border-line px-3.5 py-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-ink">{item.nama}</p>
              <p className="text-xs text-muted">{item.alasan}</p>
            </div>
            <Button variant="secondary" className="shrink-0" disabled={done || add.isPending} onClick={() => add.mutate(item.nama)}>
              {done ? 'Ditambahkan' : 'Tambah'}
            </Button>
          </li>
        )
      })}
    </ul>
  )
}

interface NextMenuProps {
  onChoose: (panel: 'ai' | 'selesai') => void
  onDone: () => void
}

// Guests have used their one AI bulat, so both options ask for an account.
function NextMenu({ onChoose, onDone }: NextMenuProps) {
  const isGuest = useSessionStore((state) => state.mode !== 'signedIn')
  return (
    <div className="flex flex-col gap-2.5">
      <p className="text-sm text-muted">Mau lanjut dengan apa?</p>
      <OptionButton
        title="Generate pola berikutnya dengan AI"
        text="AI mengusulkan tiga pola yang bisa dipelajari sesudahnya."
        locked={isGuest}
        onClick={() => onChoose('ai')}
      />
      <OptionButton
        title="Dari pola yang sudah diselesaikan"
        text="Pilih pola yang sudah kamu kuasai sebagai awalan pola ini."
        locked={isGuest}
        onClick={() => onChoose('selesai')}
      />
      <div className="flex justify-end pt-1">
        <Button variant="secondary" onClick={onDone}>
          Selesai
        </Button>
      </div>
    </div>
  )
}

interface OptionButtonProps {
  title: string
  text: string
  locked?: boolean
  onClick: () => void
}

function OptionButton({ title, text, locked = false, onClick }: OptionButtonProps) {
  if (locked) {
    return (
      <Link to="/masuk?redirect=%2Flearning" className="flex items-start gap-3 rounded-xl border border-line bg-slate-50 px-3.5 py-3 text-left">
        <Lock size={16} className="mt-0.5 shrink-0 text-muted" aria-hidden="true" />
        <span>
          <span className="block text-sm font-semibold text-ink">{title}</span>
          <span className="block text-xs text-muted">Masuk untuk memakai pilihan ini.</span>
        </span>
      </Link>
    )
  }
  return (
    <button type="button" onClick={onClick} className="flex flex-col rounded-xl border border-line bg-white px-3.5 py-3 text-left hover:bg-slate-50">
      <span className="text-sm font-semibold text-ink">{title}</span>
      <span className="text-xs text-muted">{text}</span>
    </button>
  )
}

interface FinishedPanelProps {
  created: CreatedTopic
  onBack: () => void
  onDone: () => void
}

// Finished patterns can come before the new one. Choosing one draws a link from it to the new pattern.
function FinishedPanel({ created, onBack, onDone }: FinishedPanelProps) {
  const queryClient = useQueryClient()
  const [linked, setLinked] = useState<string | null>(null)
  const graph = useQuery({ queryKey: ['topics'], queryFn: fetchTopicGraph })
  const finished = (graph.data?.topics ?? []).filter((topic) => topic.id !== created.id && topicStatusOf(topic) === 'DIKUASAI')
  const link = useMutation({
    mutationFn: (fromId: string) => linkTopics(fromId, created.id),
    onSuccess: async (_data, fromId) => {
      setLinked(finished.find((topic) => topic.id === fromId)?.name ?? null)
      await queryClient.invalidateQueries({ queryKey: ['topics'] })
    },
  })

  return (
    <div className="flex flex-col gap-3">
      {finished.length === 0 && (
        <p className="text-sm text-muted">Belum ada pola yang sudah kamu selesaikan. Kerjakan kuis dari sebuah pola sampai skornya 80 ke atas.</p>
      )}
      {linked && (
        <p role="status" className="text-sm text-brand-dark">
          Terhubung dari “{linked}”.
        </p>
      )}
      {finished.length > 0 && (
        <ul className="flex flex-col gap-2">
          {finished.map((topic) => (
            <li key={topic.id} className="flex items-center justify-between gap-3 rounded-xl border border-line px-3.5 py-2.5">
              <span className="min-w-0 truncate text-sm font-semibold text-ink">{topic.name}</span>
              <Button variant="secondary" className="shrink-0" disabled={link.isPending} onClick={() => link.mutate(topic.id)}>
                Sambungkan
              </Button>
            </li>
          ))}
        </ul>
      )}
      <PanelFooter onBack={onBack} onDone={onDone} />
    </div>
  )
}
