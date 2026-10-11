import { z } from 'zod'
import { materialTitleOf, validateMaterialFile, type MaterialStatus, type MaterialType } from '../domain/materi'
import { useSessionStore } from '../stores/sessionStore'
import { apiRequest } from './http'
import { addTopicMaterial } from './topics'

// Materials of a signed-in user come from the backend. Guests keep mock materials on this page session only.
export interface Material {
  id: string
  title: string
  type: MaterialType
  sizeBytes: number
  status: MaterialStatus
  summary: string[]
  suggestedTopics: string[]
  linkedTopicId: string | null
  error: string | null
}

const materialSchema = z.object({
  id: z.string(),
  title: z.string(),
  type: z.enum(['PDF', 'DOCX', 'PPTX']),
  sizeBytes: z.number(),
  status: z.enum(['MENGUNGGAH', 'MEMPROSES', 'SIAP', 'GAGAL']),
  summary: z.array(z.string()),
  suggestedTopics: z.array(z.string()),
  linkedTopicId: z.string().nullable(),
  error: z.string().nullable(),
})

const materialListSchema = z.object({ materials: z.array(materialSchema) })
const materialResponseSchema = z.object({ material: materialSchema })

// Time a file spends in "Memproses" before the mock summary is ready (guests only).
const PROCESSING_MS = 1200
const HEADER_BYTES = 8

function usesServer(): boolean {
  return useSessionStore.getState().mode === 'signedIn'
}

let materials: Material[] = []

function mockSummary(title: string): { summary: string[]; suggestedTopics: string[] } {
  return {
    summary: [
      `${title} dibagi menjadi beberapa bagian utama.`,
      'Setiap bagian memuat konsep, contoh, dan latihan singkat.',
      'Istilah penting dijelaskan di awal setiap bagian.',
      'Rumus dan contoh hitungan ditulis langkah demi langkah.',
    ],
    suggestedTopics: [`Pengantar ${title}`, `Latihan ${title}`],
  }
}

export async function fetchMaterials(): Promise<Material[]> {
  if (usesServer()) {
    return materialListSchema.parse(await apiRequest('GET', '/api/materi')).materials
  }
  return structuredClone(materials)
}

// Checks the file here first, so a file that is too large is refused before it is sent.
// The server checks again, and it also enforces the limit of 50 materials, which only it can count.
export async function uploadMaterial(file: File): Promise<Material> {
  const header = new Uint8Array(await file.slice(0, HEADER_BYTES).arrayBuffer())
  const serverMode = usesServer()
  const result = validateMaterialFile({
    name: file.name,
    size: file.size,
    header,
    existingCount: serverMode ? 0 : materials.length,
  })
  if (!result.ok) {
    throw new Error(result.message)
  }

  if (serverMode) {
    const form = new FormData()
    form.append('berkas', file)
    return materialResponseSchema.parse(await apiRequest('POST', '/api/materi', form)).material
  }

  const title = materialTitleOf(file.name)
  const material: Material = {
    id: crypto.randomUUID(),
    title,
    type: result.type,
    sizeBytes: file.size,
    status: 'MEMPROSES',
    summary: [],
    suggestedTopics: [],
    linkedTopicId: null,
    error: null,
  }
  materials = [...materials, material]

  setTimeout(() => {
    const ready = mockSummary(title)
    materials = materials.map((item) =>
      item.id === material.id ? { ...item, status: 'SIAP', summary: ready.summary, suggestedTopics: ready.suggestedTopics } : item,
    )
  }, PROCESSING_MS)

  return structuredClone(material)
}

export async function linkMaterialToTopic(materialId: string, topicId: string): Promise<void> {
  if (usesServer()) {
    await apiRequest('POST', `/api/materi/${encodeURIComponent(materialId)}/link`, { topicId })
    return
  }
  const material = materials.find((item) => item.id === materialId)
  if (!material) {
    throw new Error('Materi tidak ditemukan.')
  }
  await addTopicMaterial(topicId, material.title)
  materials = materials.map((item) => (item.id === materialId ? { ...item, linkedTopicId: topicId } : item))
}
