import { z } from 'zod'
import { validateMaterialFile, type MaterialStatus, type MaterialType } from '../domain/materi'
import { useSessionStore } from '../stores/sessionStore'
import { apiRequest } from './http'

// Materials belong to signed-in accounts and come from the backend. Guests cannot upload (docs/role.md 2.2).
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

const HEADER_BYTES = 8
const SIGN_IN_TO_UPLOAD = 'Masuk untuk mengunggah dan mengaitkan materi.'

function usesServer(): boolean {
  return useSessionStore.getState().mode === 'signedIn'
}

export async function fetchMaterials(): Promise<Material[]> {
  if (!usesServer()) {
    return []
  }
  return materialListSchema.parse(await apiRequest('GET', '/api/materi')).materials
}

// Checks the file here first, so a file that is too large is refused before it is sent.
// The server checks again, and it also enforces the limit of 50 materials, which only it can count.
export async function uploadMaterial(file: File): Promise<Material> {
  if (!usesServer()) {
    throw new Error(SIGN_IN_TO_UPLOAD)
  }
  const header = new Uint8Array(await file.slice(0, HEADER_BYTES).arrayBuffer())
  // The count is 0 here because only the server knows how many materials the account already has.
  const result = validateMaterialFile({ name: file.name, size: file.size, header, existingCount: 0 })
  if (!result.ok) {
    throw new Error(result.message)
  }
  const form = new FormData()
  form.append('berkas', file)
  return materialResponseSchema.parse(await apiRequest('POST', '/api/materi', form)).material
}

export async function linkMaterialToTopic(materialId: string, topicId: string): Promise<void> {
  if (!usesServer()) {
    throw new Error(SIGN_IN_TO_UPLOAD)
  }
  await apiRequest('POST', `/api/materi/${encodeURIComponent(materialId)}/link`, { topicId })
}
