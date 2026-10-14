import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { LoaderCircle, Sparkles, Target, X } from 'lucide-react'
import { useId, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { fetchConversationMessages } from '../../api/conversations'
import { fetchMateriParts, generateMateriPart, renameTopic } from '../../api/topics'
import { RichText } from '../../components/markdown/RichText'
import { Button } from '../../components/ui/Button'
import { topicNameSchema } from '../../domain/topicNames'
import { MASTERED_MIN_SCORE, TOPIC_STATUS_LABEL, topicStatusOf, type TopicStatus } from '../../domain/topicStatus'
import type { Topic } from '../../domain/types'
import type { SessionMode } from '../../stores/sessionStore'
import { useUiStore } from '../../stores/uiStore'
import { colors } from '../../theme/tokens'
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
  // The quiz of this chat is being prepared: the Generate soal button shows the sweep until the quiz arrives.
  const quizPreparing = useUiStore((state) => state.quizLoading && state.chatQuiz?.quizId === topic?.id)
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
      <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2 border-b border-line px-4 py-2.5">
        {topic ? (
          <div className="min-w-0 basis-full">
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
            <div className="mt-1 flex flex-col gap-1.5">
              <StatusChip status={topicStatusOf(topic)} />
              <ScoreBar score={topic.lastScore} />
              {topic.materials.length > 0 && <p className="text-xs text-muted">Materi: {topic.materials.join(', ')}</p>}
            </div>
          </div>
        ) : (
          <div className="min-w-0">
            <h2 className="truncate font-heading text-base font-semibold text-ink">{GENERAL_LEARNING_TITLE}</h2>
            <p className="mt-0.5 text-xs text-muted">Pilih neuron di kanvas untuk chat tentang topik itu.</p>
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
                <Button
                  variant="secondary"
                  className={`min-h-[36px] px-2.5 py-1 text-xs md:min-h-0${quizPreparing ? ' btn-sweep' : ''}`}
                  disabled={quizPreparing}
                  onClick={onGenerateQuiz}
                >
                  Generate soal
                </Button>
                <Button
                  variant="secondary"
                  disabled={generatePart.isPending}
                  className={`min-h-[36px] px-2.5 py-1 text-xs md:min-h-0${generatePart.isPending ? ' btn-sweep' : ''}`}
                  onClick={() => generatePart.mutate()}
                >
                  {generatePart.isPending && <LoaderCircle size={14} className="animate-spin" aria-hidden="true" />}
                  {generatePart.isPending ? 'Membuat materi...' : 'Generate materi'}
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
        <section aria-label="Materi neuron" className="max-h-[220px] overflow-y-auto border-b border-line px-4 py-3">
          {isGuest && <p className="text-xs text-muted">Materi neuron tersedia setelah masuk.</p>}
          {!isGuest && generatePart.isError && (
            <p role="alert" className="mb-2 text-xs text-red-700">
              {generatePart.error.message}
            </p>
          )}
          {!isGuest && partsQuery.data?.length === 0 && (
            <div className="flex items-center gap-3 rounded-xl border border-dashed border-line bg-brand-soft px-3 py-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-brand-dark">
                <Sparkles size={16} aria-hidden="true" />
              </span>
              <p className="text-xs text-ink">Belum ada materi. Tekan Generate materi, satu bagian setiap kali.</p>
            </div>
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
                : 'Tulis pertanyaan belajar di bawah. Pilih neuron untuk chat tentang topik tertentu.'
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
        Nama neuron
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

const STATUS_COLOR: Record<TopicStatus, string> = {
  DIKUASAI: colors.status.kuasai,
  SEDANG: colors.status.sedang,
  PERLU_DIULANG: colors.status.ulang,
  BARU: colors.status.baru,
  BELUM_DIBUKA: colors.status.belum,
  SARAN: colors.status.saran,
}

// Score a topic needs to count as mastered (docs/role.md 4.1). The bar shows it as the target.
const TARGET_SCORE = MASTERED_MIN_SCORE

// The status of the topic as a colored chip, so it can be read at a glance.
function StatusChip({ status }: { status: TopicStatus }) {
  return (
    <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-canvas px-2.5 py-1 text-xs font-semibold text-ink">
      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: STATUS_COLOR[status] }} aria-hidden="true" />
      {TOPIC_STATUS_LABEL[status]}
    </span>
  )
}

// The last score next to the target it has to reach. The bar fills as the score rises, and a tick marks the target.
function ScoreBar({ score }: { score: number | null }) {
  const value = score ?? 0
  const width = Math.min(100, Math.max(0, value))
  const reached = score !== null && score >= TARGET_SCORE
  const remaining = TARGET_SCORE - value

  return (
    <div className="flex w-full max-w-[280px] flex-col gap-2 rounded-xl border border-line bg-white px-3 py-2.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-baseline gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">Skor</span>
          <span className="font-heading text-lg font-bold leading-none text-ink">{score ?? '—'}</span>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-brand-soft px-2 py-0.5 text-[11px] font-semibold text-brand-dark">
          <Target size={12} aria-hidden="true" />
          Target {TARGET_SCORE}
        </span>
      </div>
      <div
        className="relative h-2.5 w-full rounded-full bg-canvas"
        role="progressbar"
        aria-label="Skor terakhir"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={score ?? 0}
      >
        <div className="h-full rounded-full bg-brand transition-[width] duration-500" style={{ width: `${width}%` }} />
        <span className="absolute -bottom-1 -top-1 w-0.5 rounded-full bg-ink" style={{ left: `calc(${TARGET_SCORE}% - 1px)` }} aria-hidden="true" />
      </div>
      <p className={`text-xs ${reached ? 'font-semibold text-brand-dark' : 'text-muted'}`}>
        {score === null ? 'Belum ada skor. Kerjakan kuis untuk mengisinya.' : reached ? 'Target tercapai' : `Kurang ${remaining} poin lagi`}
      </p>
    </div>
  )
}
