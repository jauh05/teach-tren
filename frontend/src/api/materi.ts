import { materialTitleOf, validateMaterialFile, type MaterialStatus, type MaterialType } from '../domain/materi'
import { addTopicMaterial } from './topics'

// Mock materials until the backend exists. Parsing and summaries are simulated.
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

// Time a file spends in "Memproses" before the mock summary is ready.
const PROCESSING_MS = 1200
const HEADER_BYTES = 8

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
  return structuredClone(materials)
}

// Checks the file, then adds it as "Memproses". It becomes "Siap" after a short delay.
export async function uploadMaterial(file: File): Promise<Material> {
  const header = new Uint8Array(await file.slice(0, HEADER_BYTES).arrayBuffer())
  const result = validateMaterialFile({
    name: file.name,
    size: file.size,
    header,
    existingCount: materials.length,
  })
  if (!result.ok) {
    throw new Error(result.message)
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
  const material = materials.find((item) => item.id === materialId)
  if (!material) {
    throw new Error('Materi tidak ditemukan.')
  }
  await addTopicMaterial(topicId, material.title)
  materials = materials.map((item) => (item.id === materialId ? { ...item, linkedTopicId: topicId } : item))
}

