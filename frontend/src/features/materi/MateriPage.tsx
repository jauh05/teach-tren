import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import clsx from 'clsx'
import { FileUp, Plus } from 'lucide-react'
import { useRef, useState, type DragEvent } from 'react'
import { Link } from 'react-router-dom'
import { fetchMaterials, linkMaterialToTopic, uploadMaterial, type Material } from '../../api/materi'
import { createTopic, fetchTopicGraph } from '../../api/topics'
import { Button } from '../../components/ui/Button'
import { Dialog } from '../../components/ui/Dialog'
import { MAX_MATERIALS_PER_USER, MAX_MATERIAL_BYTES } from '../../domain/materi'
import type { MaterialStatus } from '../../domain/materi'

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
  const queryClient = useQueryClient()
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const [uploadOpen, setUploadOpen] = useState(false)

  const materials = useQuery({
    queryKey: ['materi'],
    queryFn: fetchMaterials,
    // Poll only while a file is still being processed.
    refetchInterval: (query) => (query.state.data?.some((item) => item.status === 'MEMPROSES') ? 300 : false),
  })
  const topics = useQuery({ queryKey: ['topics'], queryFn: fetchTopicGraph })

  const upload = useMutation({
    mutationFn: uploadMaterial,
    onSuccess: async () => {
      setError(null)
      // The new file shows up in the list behind the pop-up, already in progress.
      setUploadOpen(false)
      await queryClient.invalidateQueries({ queryKey: ['materi'] })
    },
    onError: (failure) => setError(failure.message),
  })

  function handleFile(file: File | undefined) {
    if (file) {
      upload.mutate(file)
    }
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setDragging(false)
    handleFile(event.dataTransfer.files[0])
  }

  function closeUpload() {
    setUploadOpen(false)
    setError(null)
  }

  const list = materials.data ?? []
  const full = list.length >= MAX_MATERIALS_PER_USER

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-canvas">
      <div className="mx-auto flex w-full max-w-[860px] flex-col gap-5 px-4 py-6 md:px-6">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-heading text-xl font-semibold text-ink">Materi</h1>
            <p className="text-sm text-muted">
              {list.length} dari {MAX_MATERIALS_PER_USER} materi
            </p>
          </div>
          <Button disabled={full} onClick={() => setUploadOpen(true)}>
            <FileUp size={16} aria-hidden="true" />
            Unggah materi
          </Button>
        </header>

        <Dialog open={uploadOpen} title="Unggah materi" description="Berkas PDF, DOCX, atau PPTX." onClose={closeUpload}>
          <div
            onDragOver={(event) => {
              event.preventDefault()
              setDragging(true)
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            className={clsx(
              'flex flex-col items-center justify-center gap-3 rounded-[16px] border-2 border-dashed bg-white p-6 text-center',
              dragging ? 'border-brand bg-soft' : 'border-[#CBD5E1]',
            )}
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-soft text-brand-dark">
              <FileUp size={20} aria-hidden="true" />
            </span>
            <p className="text-sm text-ink">Seret berkas ke sini, atau pilih dari perangkatmu.</p>
            <p className="text-xs text-muted">Maksimal {MAX_MATERIAL_BYTES / (1024 * 1024)} MB per berkas.</p>
            <Button variant="secondary" disabled={upload.isPending || full} onClick={() => inputRef.current?.click()}>
              Pilih berkas
            </Button>
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,.docx,.pptx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.presentationml.presentation"
              aria-label="Pilih berkas materi"
              className="sr-only"
              onChange={(event) => {
                handleFile(event.target.files?.[0])
                event.target.value = ''
              }}
            />
          </div>
          {error && (
            <p role="alert" className="mt-3 text-sm text-red-700">
              {error}
            </p>
          )}
        </Dialog>

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

        <p className="text-center text-xs text-muted">
          Ringkasan di sini adalah contoh. Ringkasan dari isi berkas akan dibuat AI setelah backend tersedia.{' '}
          <Link to="/learning" className="font-semibold text-brand-dark underline">
            Buka Learning
          </Link>
        </p>
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
                className="rounded-lg border border-[#CBD5E1] bg-white px-2.5 py-2 text-sm font-normal text-ink"
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
