import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchTopicGraph } from '../../api/topics'
import type { Topic } from '../../domain/types'
import { useSessionStore } from '../../stores/sessionStore'
import { TopicCanvas } from './TopicCanvas'
import { TopicPanel } from './TopicPanel'

// Learning (/learning): topic canvas with a detail panel. Guests see the same canvas in example mode.
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

  function startChat(topic: Topic) {
    navigate('/c/baru', { state: { message: `Jelaskan ${topic.name}` } })
  }

  return (
    <section className="flex min-h-0 flex-1">
      <TopicCanvas
        topics={data.topics}
        links={data.links}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onStartChat={startChat}
      />
      {selected && (
        <TopicPanel
          key={selected.id}
          topic={selected}
          mode={mode}
          onClose={() => setSelectedId(null)}
          onStartChat={() => startChat(selected)}
          onGenerateQuiz={() => navigate(`/kuis/${selected.id}`)}
        />
      )}
    </section>
  )
}
