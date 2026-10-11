import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import clsx from 'clsx'
import { Lock } from 'lucide-react'
import { useId, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { z } from 'zod'
import { createTopic, fetchTopicGraph, linkTopics, suggestPatterns } from '../../api/topics'
import { Button } from '../../components/ui/Button'
import { Dialog } from '../../components/ui/Dialog'
import { topicNameSchema } from '../../domain/topicNames'
import { topicStatusOf } from '../../domain/topicStatus'
import { useSessionStore } from '../../stores/sessionStore'

const schema = z.object({ name: topicNameSchema })
type Values = z.infer<typeof schema>

interface CreatedTopic {
  id: string
  name: string
}

interface AddTopicDialogProps {
  open: boolean
  // A guest who already has the one topic of the device sees the sign-in prompt instead of the form.
  locked: boolean
  onClose: () => void
  // Called with the id of the new topic, so the canvas can select it.
  onCreated: (topicId: string) => void
}

// Adds a pattern (pola belajar). After it is added, the user chooses what comes next:
// an AI suggestion, or a pattern that is already finished as the start of this one.
export function AddTopicDialog({ open, locked, onClose, onCreated }: AddTopicDialogProps) {
  const [created, setCreated] = useState<CreatedTopic | null>(null)
  const [panel, setPanel] = useState<'menu' | 'ai' | 'selesai'>('menu')
  const queryClient = useQueryClient()
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { name: '' } })
  const inputId = useId()

  const create = useMutation({
    mutationFn: (name: string) => createTopic(name),
    onSuccess: async (topicId, name) => {
      await queryClient.invalidateQueries({ queryKey: ['topics'] })
      reset()
      setCreated({ id: topicId, name })
      onCreated(topicId)
    },
    onError: (error) => {
      setError('name', { message: error.message })
    },
  })

  function close() {
    reset()
    setCreated(null)
    setPanel('menu')
    onClose()
  }

  if (locked && !created) {
    return (
      <Dialog open={open} title="Tambah belajar" description="Pola belajar kedua dan seterusnya dibuat di akun." onClose={close}>
        <div className="flex flex-col gap-3">
          <p className="text-sm text-muted">Kamu sudah punya satu pola di perangkat ini. Masuk untuk menambah pola lagi, dan pola ini ikut pindah ke akunmu.</p>
          <Link to="/masuk?redirect=%2Flearning" className="inline-flex min-h-[44px] items-center justify-center rounded-[10px] bg-brand px-3.5 text-[13px] font-semibold text-white hover:bg-brand-dark md:min-h-0 md:py-2">
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
        {panel === 'ai' && <AiPanel created={created} onBack={() => setPanel('menu')} />}
        {panel === 'selesai' && <FinishedPanel created={created} onBack={() => setPanel('menu')} />}
      </Dialog>
    )
  }

  return (
    <Dialog open={open} title="Tambah belajar" description="Tulis pola belajar yang ingin kamu pelajari." onClose={close}>
      <form onSubmit={handleSubmit((values) => create.mutate(values.name))} noValidate className="flex flex-col gap-3">
        <label htmlFor={inputId} className="text-sm font-semibold text-ink">
          Nama pola belajar
        </label>
        <input
          id={inputId}
          type="text"
          autoComplete="off"
          placeholder="Contoh: Persamaan linear"
          aria-invalid={errors.name ? 'true' : undefined}
          className="w-full rounded-lg border border-[#CBD5E1] bg-white px-3 py-2 text-sm text-ink outline-none focus:border-brand"
          {...register('name')}
        />
        {errors.name && (
          <p role="alert" className="text-xs text-red-700">
            {errors.name.message}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={close}>
            Batal
          </Button>
          <Button type="submit" disabled={create.isPending}>
            Tambah
          </Button>
        </div>
      </form>
    </Dialog>
  )
}

interface NextMenuProps {
  onChoose: (panel: 'ai' | 'selesai') => void
  onDone: () => void
}

// Guests see the two options, but using them needs an account.
function NextMenu({ onChoose, onDone }: NextMenuProps) {
  const isGuest = useSessionStore((state) => state.mode !== 'signedIn')
  return (
    <div className="flex flex-col gap-2.5">
      <p className="text-sm text-muted">Mau lanjut dengan apa?</p>
      <OptionButton
        title="Buat dengan AI"
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
  locked: boolean
  onClick: () => void
}

function OptionButton({ title, text, locked, onClick }: OptionButtonProps) {
  if (locked) {
    return (
      <Link
        to="/masuk?redirect=%2Flearning"
        className="flex items-start gap-3 rounded-xl border border-line bg-slate-50 px-3.5 py-3 text-left"
      >
        <Lock size={16} className="mt-0.5 shrink-0 text-muted" aria-hidden="true" />
        <span>
          <span className="block text-sm font-semibold text-ink">{title}</span>
          <span className="block text-xs text-muted">Masuk untuk memakai pilihan ini.</span>
        </span>
      </Link>
    )
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx('flex flex-col rounded-xl border border-line bg-white px-3.5 py-3 text-left hover:bg-slate-50')}
    >
      <span className="text-sm font-semibold text-ink">{title}</span>
      <span className="text-xs text-muted">{text}</span>
    </button>
  )
}

interface PanelProps {
  created: CreatedTopic
  onBack: () => void
}

// The AI suggests three patterns after the new one. Each one becomes a topic only when the user adds it.
function AiPanel({ created, onBack }: PanelProps) {
  const queryClient = useQueryClient()
  const [added, setAdded] = useState<string[]>([])
  const suggestions = useQuery({
    queryKey: ['pola-saran', created.id],
    queryFn: () => suggestPatterns(created.id),
    retry: false,
    staleTime: Infinity,
  })
  const add = useMutation({
    mutationFn: (name: string) => createTopic(name, created.id),
    onSuccess: async (_id, name) => {
      setAdded((current) => [...current, name])
      await queryClient.invalidateQueries({ queryKey: ['topics'] })
    },
  })

  return (
    <div className="flex flex-col gap-3">
      {suggestions.isPending && <p className="text-sm text-muted">AI sedang menyusun usulan...</p>}
      {suggestions.isError && (
        <p role="alert" className="text-sm text-red-700">
          {suggestions.error.message}
        </p>
      )}
      {suggestions.data && (
        <ul className="flex flex-col gap-2">
          {suggestions.data.map((item) => {
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
      )}
      <div className="flex justify-start">
        <Button variant="secondary" onClick={onBack}>
          Kembali
        </Button>
      </div>
    </div>
  )
}

// Finished patterns can come before the new one. Choosing one draws a link from it to the new pattern.
function FinishedPanel({ created, onBack }: PanelProps) {
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
      {linked && <p role="status" className="text-sm text-brand-dark">Terhubung dari “{linked}”.</p>}
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
      <div className="flex justify-start">
        <Button variant="secondary" onClick={onBack}>
          Kembali
        </Button>
      </div>
    </div>
  )
}
