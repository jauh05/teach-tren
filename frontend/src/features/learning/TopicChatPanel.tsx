import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { X } from 'lucide-react'
import { useId, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { fetchConversationMessages } from '../../api/conversations'
import { renameTopic } from '../../api/topics'
import { Button } from '../../components/ui/Button'
import { topicNameSchema } from '../../domain/topicNames'
import { TOPIC_STATUS_LABEL, topicStatusOf } from '../../domain/topicStatus'
import type { Topic } from '../../domain/types'
import type { SessionMode } from '../../stores/sessionStore'
import { ConversationThread } from '../chat/ConversationThread'

interface TopicChatPanelProps {
  topic: Topic
  mode: SessionMode
  onClose: () => void
  onGenerateQuiz: () => void
}

// Chat about one topic. Selecting a topic on the canvas opens its conversation here.
// Panel below the canvas on desktop, bottom sheet (70% height) on mobile.
export function TopicChatPanel({ topic, mode, onClose, onGenerateQuiz }: TopicChatPanelProps) {
  const status = topicStatusOf(topic)
  const isGuest = mode === 'guest'
  const [editing, setEditing] = useState(false)
  const messagesQuery = useQuery({
    queryKey: ['messages', topic.id],
    queryFn: () => fetchConversationMessages(topic.id),
  })

  return (
    <aside
      aria-label="Chat topik"
      className="fixed inset-x-0 bottom-0 z-30 flex h-[70%] flex-col rounded-t-[18px] border-t border-line bg-white shadow-xl md:static md:h-[300px] md:shrink-0 md:rounded-none md:border-t md:shadow-none"
    >
      <div aria-hidden="true" className="mx-auto mt-2 h-1 w-10 rounded-full bg-slate-300 md:hidden" />
      <div className="flex items-start justify-between gap-3 border-b border-line px-4 py-3">
        <div className="min-w-0">
          <h2 className="truncate font-heading text-base font-semibold text-ink">{topic.name}</h2>
          <p className="mt-0.5 text-xs text-muted">
            {TOPIC_STATUS_LABEL[status]} · skor {topic.lastScore ?? 'belum ada'}
          </p>
          {topic.materials.length > 0 && (
            <p className="mt-0.5 truncate text-xs text-muted">Materi: {topic.materials.join(', ')}</p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {isGuest ? (
            <Button variant="locked" aria-disabled="true" className="min-h-[36px] px-2.5 py-1 text-xs md:min-h-0">
              Generate soal
            </Button>
          ) : (
            <>
              <Button variant="secondary" className="min-h-[36px] px-2.5 py-1 text-xs md:min-h-0" onClick={onGenerateQuiz}>
                Generate soal
              </Button>
              <Button
                variant="secondary"
                aria-expanded={editing}
                className="min-h-[36px] px-2.5 py-1 text-xs md:min-h-0"
                onClick={() => setEditing((value) => !value)}
              >
                Ganti nama
              </Button>
            </>
          )}
          <button
            type="button"
            aria-label="Tutup chat topik"
            onClick={onClose}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-slate-50 hover:text-ink md:h-8 md:w-8"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>
      </div>

      {editing && !isGuest && (
        <div className="border-b border-line px-4 py-3">
          <RenameForm key={topic.id} topicId={topic.id} currentName={topic.name} onDone={() => setEditing(false)} />
        </div>
      )}

      <div className="flex min-h-0 flex-1 flex-col">
        {messagesQuery.isPending ? (
          <p className="p-4 text-sm text-muted">Memuat percakapan...</p>
        ) : (
          <ConversationThread
            key={topic.id}
            conversationId={topic.id}
            title={topic.name}
            initialMessages={messagesQuery.data ?? []}
            emptyText={`Belum ada percakapan tentang ${topic.name}. Tulis pertanyaan di bawah.`}
            compact
          />
        )}
      </div>
    </aside>
  )
}

const renameSchema = z.object({ name: topicNameSchema })
type RenameValues = z.infer<typeof renameSchema>

interface RenameFormProps {
  topicId: string
  currentName: string
  onDone: () => void
}

function RenameForm({ topicId, currentName, onDone }: RenameFormProps) {
  const inputId = useId()
  const queryClient = useQueryClient()
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<RenameValues>({
    resolver: zodResolver(renameSchema),
    defaultValues: { name: currentName },
  })

  const rename = useMutation({
    mutationFn: (name: string) => renameTopic(topicId, name),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['topics'] })
      onDone()
    },
    onError: (error) => {
      setError('name', { message: error.message })
    },
  })

  return (
    <form
      onSubmit={handleSubmit((values) => rename.mutate(values.name))}
      noValidate
      className="flex flex-col gap-2 rounded-xl border border-line bg-slate-50 p-3"
    >
      <label htmlFor={inputId} className="text-xs font-semibold text-ink">
        Nama bulat
      </label>
      <input
        id={inputId}
        type="text"
        aria-invalid={errors.name ? 'true' : undefined}
        className="w-full rounded-lg border border-[#CBD5E1] bg-white px-3 py-2 text-sm text-ink outline-none focus:border-brand"
        {...register('name')}
      />
      {errors.name && (
        <p role="alert" className="text-xs text-red-700">
          {errors.name.message}
        </p>
      )}
      <div className="flex gap-2">
        <Button type="submit" className="min-h-[36px] md:min-h-0" disabled={rename.isPending}>
          Simpan
        </Button>
        <Button variant="secondary" className="min-h-[36px] md:min-h-0" onClick={onDone}>
          Batal
        </Button>
      </div>
    </form>
  )
}
