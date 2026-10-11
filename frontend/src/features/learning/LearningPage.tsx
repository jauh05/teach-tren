import { useQuery } from '@tanstack/react-query'
import { Maximize2, Minimize2 } from 'lucide-react'
import { useState } from 'react'
import { fetchTopicGraph } from '../../api/topics'
import { useSessionStore } from '../../stores/sessionStore'
import { useUiStore } from '../../stores/uiStore'
import { LearningChatPanel } from './TopicChatPanel'
import { TopicCanvas } from './TopicCanvas'

// Learning (/learning): topic canvas on top, chat below it. The chat is always visible.
// The board can be enlarged for exploring topics, then shrunk to give the chat more room.
export function LearningPage() {
  const openQuizSetup = useUiStore((state) => state.openQuizSetup)
  const mode = useSessionStore((state) => state.mode)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [boardExpanded, setBoardExpanded] = useState(false)
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

  return (
    <section className="flex min-h-0 flex-1 flex-col">
      <div className="relative flex min-h-[180px] flex-col" style={{ flex: boardExpanded ? 3 : 1 }}>
        <TopicCanvas topics={data.topics} links={data.links} selectedId={selectedId} onSelect={setSelectedId} />
        <button
          type="button"
          aria-pressed={boardExpanded}
          onClick={() => setBoardExpanded((value) => !value)}
          className="absolute left-3 top-3 flex min-h-[36px] items-center gap-1.5 rounded-xl border border-line bg-white px-3 text-micro font-semibold text-ink shadow-sm hover:bg-slate-50 md:min-h-[32px]"
        >
          {boardExpanded ? <Minimize2 size={14} aria-hidden="true" /> : <Maximize2 size={14} aria-hidden="true" />}
          {boardExpanded ? 'Kecilkan papan' : 'Perbesar papan'}
        </button>
      </div>

      <div className="flex min-h-[240px] flex-col border-t border-line" style={{ flex: boardExpanded ? 1 : 1.2 }}>
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
