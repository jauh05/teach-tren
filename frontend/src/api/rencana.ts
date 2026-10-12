import { z } from 'zod'
import type { CurriculumLevel, DraftRoadmap, PlanPayload } from '../domain/rencana'
import { apiRequest } from './http'

// The learning plan is saved on the account, so it is read and written through the backend.
// Guests do not have a plan. Learning is open to them without one.

export const RENCANA_QUERY_KEY = ['rencana'] as const

const kurikulumSchema = z.object({
  jenjang: z.array(
    z.object({
      id: z.enum(['sd', 'smp', 'sma', 'kuliah']),
      label: z.string(),
      gradeUnit: z.enum(['Kelas', 'Semester']),
      grades: z.array(z.number()),
      subjects: z.array(z.object({ name: z.string(), topics: z.array(z.string()) })),
    }),
  ),
})

const rencanaSchema = z.object({
  rencana: z
    .object({
      levelId: z.enum(['sd', 'smp', 'sma', 'kuliah']),
      grade: z.number(),
      subjects: z.array(z.string()),
      dibuatPada: z.string(),
    })
    .nullable(),
})

const saveSchema = z.object({
  rencana: rencanaSchema.shape.rencana.unwrap(),
  bulat: z.number(),
})

export type SavedPlan = z.infer<typeof rencanaSchema>['rencana']

export async function getKurikulum(): Promise<CurriculumLevel[]> {
  return kurikulumSchema.parse(await apiRequest('GET', '/api/kurikulum')).jenjang
}

export async function getRencana(): Promise<SavedPlan> {
  return rencanaSchema.parse(await apiRequest('GET', '/api/rencana')).rencana
}

const roadmapSchema = z.object({
  cabang: z.array(z.object({ mapel: z.string(), nama: z.string() })),
  sumber: z.enum(['ai', 'katalog']),
})

// Writes the roadmap for the chosen level, grade, and subjects. Nothing is saved until the user accepts it.
export async function generateRoadmap(choices: { levelId: string; grade: number; subjects: string[] }): Promise<DraftRoadmap> {
  const roadmap = roadmapSchema.parse(await apiRequest('POST', '/api/rencana/roadmap', choices))
  return {
    sumber: roadmap.sumber,
    cabang: roadmap.cabang.map((item) => ({ subject: item.mapel, name: item.nama })),
  }
}

// Saves the plan. The server makes one topic per branch of the roadmap, so the Learning canvas shows it at once.
export async function saveRencana(plan: PlanPayload): Promise<number> {
  return saveSchema.parse(await apiRequest('POST', '/api/rencana', plan)).bulat
}
