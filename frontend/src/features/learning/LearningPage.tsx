import { useQuery } from '@tanstack/react-query'
import { Maximize2, Minimize2, Plus } from 'lucide-react'
import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent as ReactPointerEvent } from 'react'
import { fetchTopicGraph } from '../../api/topics'
import { Button } from '../../components/ui/Button'
import { useSessionStore } from '../../stores/sessionStore'
import { useUiStore } from '../../stores/uiStore'
import { AddTopicDialog } from './AddTopicDialog'
import { LearningChatPanel } from './TopicChatPanel'
import { TopicCanvas } from './TopicCanvas'

// Learning (/learning). Desktop: the topic canvas on the left and the chat on the right, with a divider that can be dragged.
// Mobile: the canvas on top and the chat below. The chat is always visible.
const SPLIT_KEY = 'teach-tren-learning-split'
const MIN_RATIO = 0.3
const MAX_RATIO = 0.8
const DEFAULT_RATIO = 0.6
const EXPANDED_RATIO = 0.78
const KEY_STEP = 0.02
const DESKTOP_QUERY = '(min-width: 768px)'

function clampRatio(value: number): number {
  return Math.min(MAX_RATIO, Math.max(MIN_RATIO, value))
}

// Remembers the width the user chose on this device. Falls back to the default when nothing valid is stored.
function readStoredRatio(): number {
  try {
    const value = Number(localStorage.getItem(SPLIT_KEY))
    return Number.isFinite(value) && value >= MIN_RATIO && value <= MAX_RATIO ? value : DEFAULT_RATIO
  } catch {
    return DEFAULT_RATIO
  }
}

function storeRatio(value: number): void {
  try {
    localStorage.setItem(SPLIT_KEY, String(value))
  } catch {
    // Storage can be blocked. The width then lasts only for this visit.
  }
}

function useIsDesktop(): boolean {
  const [desktop, setDesktop] = useState(() => window.matchMedia(DESKTOP_QUERY).matches)
  useEffect(() => {
    const query = window.matchMedia(DESKTOP_QUERY)
    const update = () => setDesktop(query.matches)
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])
  return desktop
}

export function LearningPage() {
  const mode = useSessionStore((state) => state.mode)
  const openQuizSetup = useUiStore((state) => state.openQuizSetup)
  const isDesktop = useIsDesktop()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [boardExpanded, setBoardExpanded] = useState(false)
  const [adding, setAdding] = useState(false)
  const [ratio, setRatio] = useState(readStoredRatio)
  const sectionRef = useRef<HTMLElement>(null)
  const { data, isPending, isError } = useQuery({
    queryKey: ['topics'],
    queryFn: fetchTopicGraph,
  })

  if (isPending) {
    return <p className="p-6 text-sm text-muted">Memuat bulat...</p>
  }

  if (isError) {
    return (
      <p role="alert" className="p-6 text-sm text-red-700">
        Bulat belum bisa dimuat. Coba muat ulang halaman.
      </p>
    )
  }

  const selected = data.topics.find((topic) => topic.id === selectedId) ?? null
  // Desktop: the button switches between the chosen width and a larger board.
  const boardShare = boardExpanded ? EXPANDED_RATIO : ratio

  function setSplit(value: number) {
    const next = clampRatio(value)
    setRatio(next)
    setBoardExpanded(false)
    storeRatio(next)
  }

  // Moves the divider to the pointer, measured against the whole page area.
  function resizeTo(clientX: number) {
    const box = sectionRef.current?.getBoundingClientRect()
    if (box && box.width > 0) {
      setSplit((clientX - box.left) / box.width)
    }
  }

  function handleDividerKey(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      setSplit(ratio - KEY_STEP)
    } else if (event.key === 'ArrowRight') {
      event.preventDefault()
      setSplit(ratio + KEY_STEP)
    }
  }

  function handleDividerPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      resizeTo(event.clientX)
    }
  }

  return (
    <section ref={sectionRef} className="flex min-h-0 flex-1 flex-col md:flex-row">
      <div
        className="relative flex min-h-[180px] min-w-0 flex-col md:min-h-0"
        style={{ flex: isDesktop ? `0 0 ${boardShare * 100}%` : boardExpanded ? 3 : 1 }}
      >
        <TopicCanvas topics={data.topics} links={data.links} selectedId={selectedId} onSelect={setSelectedId} />
        <div className="absolute left-3 top-3 flex gap-2">
          <button
            type="button"
            aria-pressed={boardExpanded}
            onClick={() => setBoardExpanded((value) => !value)}
            className="flex min-h-[36px] items-center gap-1.5 rounded-xl border border-line bg-white px-3 text-micro font-semibold text-ink shadow-sm hover:bg-slate-50 md:min-h-[32px]"
          >
            {boardExpanded ? <Minimize2 size={14} aria-hidden="true" /> : <Maximize2 size={14} aria-hidden="true" />}
            {boardExpanded ? 'Kecilkan papan' : 'Perbesar papan'}
          </button>
          {mode === 'signedIn' && (
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="flex min-h-[36px] items-center gap-1.5 rounded-xl border border-line bg-white px-3 text-micro font-semibold text-ink shadow-sm hover:bg-slate-50 md:min-h-[32px]"
            >
              <Plus size={14} aria-hidden="true" />
              Tambah bulat
            </button>
          )}
        </div>
        {mode === 'signedIn' && data.topics.length === 0 && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-6">
            <div className="pointer-events-auto flex max-w-[320px] flex-col items-center gap-3 text-center">
              <h2 className="font-heading text-base font-semibold text-ink">Belum ada bulat</h2>
              <p className="text-sm text-muted">
                Tambah topik yang ingin kamu pelajari. Kamu juga bisa bertanya di chat atau mengunggah materi.
              </p>
              <Button onClick={() => setAdding(true)}>Tambah bulat pertama</Button>
            </div>
          </div>
        )}
        <AddTopicDialog
          open={adding}
          onClose={() => setAdding(false)}
          onCreated={(topicId) => {
            setAdding(false)
            setSelectedId(topicId)
          }}
        />
      </div>

      <div
        role="separator"
        aria-orientation="vertical"
        aria-label="Ubah lebar papan dan chat"
        aria-valuemin={Math.round(MIN_RATIO * 100)}
        aria-valuemax={Math.round(MAX_RATIO * 100)}
        aria-valuenow={Math.round(boardShare * 100)}
        tabIndex={0}
        onPointerDown={(event) => event.currentTarget.setPointerCapture(event.pointerId)}
        onPointerMove={handleDividerPointerMove}
        onPointerUp={(event) => event.currentTarget.releasePointerCapture(event.pointerId)}
        onKeyDown={handleDividerKey}
        className="group hidden w-2 shrink-0 cursor-col-resize touch-none justify-center focus:outline-none md:flex"
      >
        <span className="w-px bg-line transition-colors group-hover:bg-brand group-focus-visible:bg-brand" />
      </div>

      <div
        className="flex min-h-[240px] min-w-0 flex-col border-t border-line md:min-h-0 md:border-l md:border-t-0"
        style={{ flex: isDesktop ? 1 : boardExpanded ? 1 : 1.2 }}
      >
        {/* Desktop: the chat keeps side margins. Mobile uses the full width. */}
        <LearningChatPanel
          topic={selected}
          mode={mode}
          onClose={() => setSelectedId(null)}
          onGenerateQuiz={() => {
            if (selected) {
              openQuizSetup(selected.id)
            }
          }}
        />
      </div>
    </section>
  )
}
