import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import clsx from 'clsx'
import { FileUp, Plus } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchMaterials, linkMaterialToTopic, type Material } from '../../api/materi'
import { createTopic, fetchTopicGraph } from '../../api/topics'
import { Button } from '../../components/ui/Button'
import { MAX_MATERIALS_PER_USER } from '../../domain/materi'
import type { MaterialStatus } from '../../domain/materi'
import { useSessionStore } from '../../stores/sessionStore'
import { useTabScroll } from '../../lib/tabScroll'
import { MaterialUploadDialog } from './MaterialUploadDialog'

const STATUS_LABEL: Record<MaterialStatus, string> = {
  MENGUNGGAH: 'Mengunggah',
  MEMPROSES: 'Memproses',
  SIAP: 'Siap',
  GAGAL: 'Gagal',
}

const STATUS_CLASS: Record<MaterialStatus, string> = {
  MENGUNGGAH: 'bg-slate-100 text-slate-700',
  MEMPROSES: 'bg-[#FFFBEB] text-[#92400E]',
  SIAP: 'bg-green-50 text-green-800',
  GAGAL: 'bg-red-50 text-red-800',
}

// Study materials (/materi). Upload PDF, DOCX, or PPTX from a pop-up, then get a summary and topic suggestions.
export function MateriPage() {
  const isGuest = useSessionStore((state) => state.mode === 'guest')
  const [uploadOpen, setUploadOpen] = useState(false)
  const scroll = useTabScroll<HTMLElement>('materi')

  const materials = useQuery({
    queryKey: ['materi'],
    queryFn: fetchMaterials,
    // Poll only while a file is still being processed.
    refetchInterval: (query) => (query.state.data?.some((item) => item.status === 'MEMPROSES') ? 2000 : false),
  })
  const topics = useQuery({ queryKey: ['topics'], queryFn: fetchTopicGraph })

  const list = materials.data ?? []
  const full = list.length >= MAX_MATERIALS_PER_USER

  return (
    <section {...scroll} className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-canvas">
      <div className="mx-auto flex w-full max-w-[860px] flex-col gap-5 px-4 py-6 md:px-6">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-heading text-xl font-semibold text-ink">Materi</h1>
            <p className="text-sm text-muted">
              {list.length} dari {MAX_MATERIALS_PER_USER} materi
            </p>
          </div>
          {isGuest ? (
            <Link
              to="/masuk?redirect=%2Fmateri"
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-[10px] bg-brand px-3.5 text-[13px] font-semibold text-white hover:bg-brand-dark md:min-h-0 md:py-2"
            >
              Masuk untuk mengunggah
            </Link>
          ) : (
            <Button disabled={full} onClick={() => setUploadOpen(true)}>
              <FileUp size={16} aria-hidden="true" />
              Unggah materi
            </Button>
          )}
        </header>

        {isGuest && (
          <p className="rounded-xl border border-line bg-slate-50 px-3 py-2 text-sm text-ink">
            Materi hanya untuk akun. Setelah masuk, kamu bisa mengunggah modul atau catatan, lalu mengaitkannya ke bulat.
          </p>
        )}

        <MaterialUploadDialog open={uploadOpen} onClose={() => setUploadOpen(false)} />

        {list.length === 0 ? (
          <p className="text-center text-sm text-muted">Belum ada materi. Unggah modul atau catatan untuk mulai.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {list.map((material) => (
              <li key={material.id}>
                <MaterialCard material={material} topics={topics.data?.topics ?? []} />
              </li>
            ))}
          </ul>
        )}

      </div>
    </section>
  )
}

interface MaterialCardProps {
  material: Material
  topics: { id: string; name: string }[]
}

function MaterialCard({ material, topics }: MaterialCardProps) {
  const queryClient = useQueryClient()
  const [createdNames, setCreatedNames] = useState<string[]>([])

  const create = useMutation({
    mutationFn: (name: string) => createTopic(name),
    onSuccess: async (_id, name) => {
      setCreatedNames((current) => [...current, name])
      await queryClient.invalidateQueries({ queryKey: ['topics'] })
    },
  })

  const link = useMutation({
    mutationFn: (topicId: string) => linkMaterialToTopic(material.id, topicId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['materi'] })
      await queryClient.invalidateQueries({ queryKey: ['topics'] })
    },
  })

  const linkedName = topics.find((topic) => topic.id === material.linkedTopicId)?.name ?? null

  return (
    <article className="flex flex-col gap-3 rounded-[16px] border border-line bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate font-heading text-base font-semibold text-ink">{material.title}</h2>
          <p className="mt-0.5 text-xs text-muted">
            {material.type} · {(material.sizeBytes / (1024 * 1024)).toFixed(1)} MB
            {linkedName && ` · Terkait bulat ${linkedName}`}
          </p>
        </div>
        <span className={clsx('shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold', STATUS_CLASS[material.status])}>
          {STATUS_LABEL[material.status]}
        </span>
      </div>

      {material.status === 'SIAP' && (
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <h3 className="text-xs font-semibold text-muted">Ringkasan</h3>
            <ul className="mt-1.5 flex list-disc flex-col gap-1 pl-5 text-sm text-ink">
              {material.summary.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-xs font-semibold text-muted">Usulan topik</h3>
            <ul className="mt-1.5 flex flex-col gap-1.5">
              {material.suggestedTopics.map((name) => {
                const created = createdNames.includes(name) || topics.some((topic) => topic.name === name)
                return (
                  <li key={name} className="flex items-center justify-between gap-2 rounded-lg border border-line bg-canvas px-3 py-2 text-sm text-ink">
                    <span className="min-w-0 truncate">{name}</span>
                    <Button
                      variant="secondary"
                      className="min-h-[36px] shrink-0 px-2.5 py-1 text-xs md:min-h-0"
                      disabled={created || create.isPending}
                      onClick={() => create.mutate(name)}
                    >
                      <Plus size={14} aria-hidden="true" />
                      {created ? 'Sudah dibuat' : 'Buat bulat'}
                    </Button>
                  </li>
                )
              })}
            </ul>
            <label className="mt-3 flex flex-col gap-1 text-xs font-semibold text-muted">
              Kaitkan ke bulat
              <select
                value={material.linkedTopicId ?? ''}
                onChange={(event) => {
                  if (event.target.value) {
                    link.mutate(event.target.value)
                  }
                }}
                className="rounded-lg border border-line bg-white px-2.5 py-2 text-sm font-normal text-ink"
              >
                <option value="">Pilih bulat</option>
                {topics.map((topic) => (
                  <option key={topic.id} value={topic.id}>
                    {topic.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      )}

      {material.status === 'MEMPROSES' && <p className="text-sm text-muted">Materi sedang diproses. Tunggu sebentar.</p>}
    </article>
  )
}
