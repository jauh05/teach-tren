import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { fetchTopicGraph } from '../../api/topics'
import { useSessionStore } from '../../stores/sessionStore'
import { TopicCanvas } from './TopicCanvas'
import { TopicChatPanel } from './TopicChatPanel'

// Learning (/learning): topic canvas with the chat of the selected topic beside it.
// Guests see the same canvas in example mode.
export function LearningPage() {
  const navigate = useNavigate()
  const mode = useSessionStore((state) => state.mode)
  const [selectedId, setSelectedId] = useState<string | null>(null)
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
      <TopicCanvas topics={data.topics} links={data.links} selectedId={selectedId} onSelect={setSelectedId} />
      {selected ? (
        <TopicChatPanel
          key={selected.id}
          topic={selected}
          mode={mode}
          onClose={() => setSelectedId(null)}
          onGenerateQuiz={() => navigate(`/kuis/${selected.id}`)}
        />
      ) : (
        <EmptyChatColumn />
      )}
    </section>
  )
}

// Desktop placeholder below the canvas until a topic is selected.
function EmptyChatColumn() {
  return (
    <aside
      aria-label="Chat topik"
      className="hidden h-[300px] shrink-0 flex-col items-center justify-center gap-3 border-t border-line bg-white p-6 text-center md:flex"
    >
      <p className="text-sm text-muted">Pilih bulat di kanvas untuk membuka percakapan tentang topik itu.</p>
      <Link to="/chat" className="text-sm font-semibold text-brand-dark underline">
        Buka chat umum
      </Link>
    </aside>
  )
}
