import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { X } from 'lucide-react'
import { useId, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { renameTopic } from '../../api/topics'
import { Button } from '../../components/ui/Button'
import { TOPIC_STATUS_LABEL, topicStatusOf } from '../../domain/topicStatus'
import { topicNameSchema } from '../../domain/topicNames'
import type { Topic } from '../../domain/types'
import type { SessionMode } from '../../stores/sessionStore'

interface TopicPanelProps {
  topic: Topic
  mode: SessionMode
  onClose: () => void
  onStartChat: () => void
  onGenerateQuiz: () => void
}

// Detail panel for one topic. Right column on desktop, bottom sheet (70% height) on mobile.
export function TopicPanel({ topic, mode, onClose, onStartChat, onGenerateQuiz }: TopicPanelProps) {
  const status = topicStatusOf(topic)
  const isGuest = mode === 'guest'
  const [editing, setEditing] = useState(false)

  return (
    <aside
      aria-label="Detail bulat"
      className="fixed inset-x-0 bottom-0 z-30 flex h-[70%] flex-col rounded-t-[18px] border-t border-line bg-white shadow-xl md:static md:h-auto md:w-detail-panel md:shrink-0 md:rounded-none md:border-l md:border-t-0 md:shadow-none"
    >
      <div aria-hidden="true" className="mx-auto mt-2 h-1 w-10 rounded-full bg-slate-300 md:hidden" />
      <div className="flex items-start justify-between gap-3 border-b border-line px-4 py-3">
        <div className="min-w-0">
          <h2 className="truncate font-heading text-lg font-semibold text-ink">{topic.name}</h2>
          <p className="mt-0.5 text-xs text-muted">{TOPIC_STATUS_LABEL[status]}</p>
        </div>
        <button
          type="button"
          aria-label="Tutup detail"
          onClick={onClose}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-slate-50 hover:text-ink md:h-8 md:w-8"
        >
          <X size={18} aria-hidden="true" />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-xs text-muted">Skor terakhir</dt>
            <dd className="font-semibold text-ink">{topic.lastScore ?? 'Belum ada latihan'}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Percakapan</dt>
            <dd className="font-semibold text-ink">{topic.conversationCount}</dd>
          </div>
        </dl>

        <h3 className="mb-1.5 mt-5 text-xs font-semibold text-muted">Materi terkait</h3>
        {topic.materials.length > 0 ? (
          <ul className="flex flex-col gap-1.5 text-sm text-ink">
            {topic.materials.map((material) => (
              <li key={material} className="rounded-lg border border-line bg-slate-50 px-3 py-2">
                {material}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">Belum ada materi terkait.</p>
        )}

        {editing && !isGuest && (
          <RenameForm
            key={topic.id}
            topicId={topic.id}
            currentName={topic.name}
            onDone={() => setEditing(false)}
          />
        )}
      </div>

      <div className="flex flex-col gap-2 border-t border-line px-4 py-3">
        <Button onClick={onStartChat}>Mulai chat</Button>
        {isGuest ? (
          <>
            <Button variant="locked" aria-disabled="true" className="cursor-not-allowed">
              Generate soal
            </Button>
            <p className="text-center text-xs text-muted">Masuk untuk membuat soal dan mengubah bulat.</p>
          </>
        ) : (
          <>
            <Button variant="secondary" onClick={onGenerateQuiz}>
              Generate soal
            </Button>
            <Button variant="secondary" onClick={() => setEditing((value) => !value)}>
              Ganti nama
            </Button>
          </>
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
      className="mt-5 flex flex-col gap-2 rounded-xl border border-line bg-slate-50 p-3"
    >
      <label htmlFor={inputId} className="text-xs font-semibold text-ink">
        Nama bulat
      </label>
      <input
        id={inputId}
        type="text"
        aria-invalid={errors.name ? 'true' : undefined}
        aria-describedby={errors.name ? `${inputId}-error` : undefined}
        className="w-full rounded-lg border border-[#CBD5E1] bg-white px-3 py-2 text-sm text-ink outline-none focus:border-brand"
        {...register('name')}
      />
      {errors.name && (
        <p id={`${inputId}-error`} role="alert" className="text-xs text-red-700">
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
