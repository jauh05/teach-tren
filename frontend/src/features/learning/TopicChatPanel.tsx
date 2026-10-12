import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { X } from 'lucide-react'
import { useId, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { fetchConversationMessages } from '../../api/conversations'
import { fetchMateriParts, generateMateriPart, renameTopic } from '../../api/topics'
import { RichText } from '../../components/markdown/RichText'
import { Button } from '../../components/ui/Button'
import { topicNameSchema } from '../../domain/topicNames'
import { TOPIC_STATUS_LABEL, topicStatusOf } from '../../domain/topicStatus'
import type { Topic } from '../../domain/types'
import type { SessionMode } from '../../stores/sessionStore'
import { ConversationThread } from '../chat/ConversationThread'

// Conversation used when no topic is selected. Its messages are kept like any other chat.
export const GENERAL_LEARNING_ID = 'belajar-umum'
const GENERAL_LEARNING_TITLE = 'Chat belajar umum'

interface LearningChatPanelProps {
  // Null shows the general learning chat, which is always available below the canvas.
  topic: Topic | null
  mode: SessionMode
  onClose: () => void
  onGenerateQuiz: () => void
}

// Chat below the canvas. It always shows: the selected topic's conversation, or the general chat.
export function LearningChatPanel({ topic, mode, onClose, onGenerateQuiz }: LearningChatPanelProps) {
  const isGuest = mode === 'guest'
  const [editing, setEditing] = useState(false)
  const conversationId = topic?.id ?? GENERAL_LEARNING_ID
  const queryClient = useQueryClient()
  const messagesQuery = useQuery({
    queryKey: ['messages', conversationId],
    queryFn: () => fetchConversationMessages(conversationId),
  })
  const topicId = topic?.id ?? ''
  const partsQuery = useQuery({
    queryKey: ['materi-bulat', topicId],
    queryFn: () => fetchMateriParts(topicId),
    enabled: topicId !== '' && !isGuest,
  })
  // One click writes one part of the material. The list is refreshed with the new part.
  const generatePart = useMutation({
    mutationFn: () => generateMateriPart(topicId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['materi-bulat', topicId] }),
  })

  return (
    <aside aria-label="Chat topik" className="flex h-full min-h-0 flex-col bg-white">
      <div className="flex items-start justify-between gap-3 border-b border-line px-4 py-2.5">
        {topic ? (
          <div className="min-w-0">
            {/* Three clicks on the name open the rename form. The button for materials sits on the right. */}
            <h2
              className="select-none truncate font-heading text-base font-semibold text-ink"
              title={isGuest ? undefined : 'Klik tiga kali untuk mengganti nama'}
              onClick={(event) => {
                if (event.detail === 3 && !isGuest) {
                  setEditing(true)
                }
              }}
            >
              {topic.name}
            </h2>
            <p className="mt-0.5 text-xs text-muted">
              {TOPIC_STATUS_LABEL[topicStatusOf(topic)]} · skor {topic.lastScore ?? 'belum ada'}
              {topic.materials.length > 0 && ` · Materi: ${topic.materials.join(', ')}`}
            </p>
          </div>
        ) : (
          <div className="min-w-0">
            <h2 className="truncate font-heading text-base font-semibold text-ink">{GENERAL_LEARNING_TITLE}</h2>
            <p className="mt-0.5 text-xs text-muted">Pilih bulat di kanvas untuk chat tentang topik itu.</p>
          </div>
        )}

        {topic && (
          <div className="flex shrink-0 items-center gap-1">
            {isGuest ? (
              <>
                <Button variant="locked" aria-disabled="true" className="min-h-[36px] px-2.5 py-1 text-xs md:min-h-0">
                  Generate soal
                </Button>
                <Button variant="locked" aria-disabled="true" className="min-h-[36px] px-2.5 py-1 text-xs md:min-h-0">
                  Generate materi
                </Button>
              </>
            ) : (
              <>
                <Button variant="secondary" className="min-h-[36px] px-2.5 py-1 text-xs md:min-h-0" onClick={onGenerateQuiz}>
                  Generate soal
                </Button>
                <Button
                  variant="secondary"
                  className="min-h-[36px] px-2.5 py-1 text-xs md:min-h-0"
                  disabled={generatePart.isPending}
                  onClick={() => generatePart.mutate()}
                >
                  Generate materi
                </Button>
              </>
            )}
            <button
              type="button"
              aria-label="Tutup topik"
              onClick={onClose}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-slate-50 hover:text-ink"
            >
              <X size={18} aria-hidden="true" />
            </button>
          </div>
        )}
      </div>

      {topic && editing && !isGuest && (
        <div className="border-b border-line px-4 py-3">
          <RenameForm key={topic.id} topicId={topic.id} currentName={topic.name} onDone={() => setEditing(false)} />
        </div>
      )}

      {topic && (
        <section aria-label="Materi bulat" className="max-h-[220px] overflow-y-auto border-b border-line px-4 py-3">
          {isGuest && <p className="text-xs text-muted">Materi bulat tersedia setelah masuk.</p>}
          {!isGuest && generatePart.isError && (
            <p role="alert" className="mb-2 text-xs text-red-700">
              {generatePart.error.message}
            </p>
          )}
          {!isGuest && partsQuery.data?.length === 0 && (
            <p className="text-xs text-muted">Belum ada materi. Tekan Generate materi, satu bagian setiap kali.</p>
          )}
          {!isGuest && partsQuery.data && partsQuery.data.length > 0 && (
            <ol className="flex flex-col gap-3">
              {partsQuery.data.map((part) => (
                <li key={part.id}>
                  <h3 className="text-sm font-semibold text-ink">{part.judul}</h3>
                  <div className="mt-1 text-sm text-ink">
                    <RichText content={part.isi} />
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>
      )}

      <div className="flex min-h-0 flex-1 flex-col">
        {messagesQuery.isPending ? (
          <p className="p-4 text-sm text-muted">Memuat percakapan...</p>
        ) : (
          <ConversationThread
            key={conversationId}
            conversationId={conversationId}
            title={topic?.name ?? GENERAL_LEARNING_TITLE}
            initialMessages={messagesQuery.data ?? []}
            emptyText={
              topic
                ? `Belum ada percakapan tentang ${topic.name}. Tulis pertanyaan di bawah.`
                : 'Tulis pertanyaan belajar di bawah. Pilih bulat untuk chat tentang topik tertentu.'
            }
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
        className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-brand"
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
