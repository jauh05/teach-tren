import { z } from 'zod'
import { normalizeTopicName } from '../topics/names.js'
import { findLevel, findSubject, LEVEL_IDS, type CurriculumLevel } from '../kurikulum/catalog.js'

export const MAX_SUBJECTS = 6
// A roadmap has 6 to 12 branches (cabang). See roadmapAi.ts.
export const MIN_CABANG = 6
export const MAX_CABANG = 12

// The learning choices: level, grade, and subjects. Each one is checked against the curriculum catalog.
const pilihanFields = z.object({
  levelId: z.enum(LEVEL_IDS, 'Pilih jenjang: SD, SMP, SMA, atau Kuliah.'),
  grade: z.number().int('Pilih kelas atau semester.'),
  subjects: z
    .array(z.string().trim().min(1).max(60))
    .min(1, 'Pilih minimal satu mata pelajaran.')
    .max(MAX_SUBJECTS, `Pilih paling banyak ${MAX_SUBJECTS} mata pelajaran.`),
})

type Pilihan = z.infer<typeof pilihanFields>

// Checks the level, the grade, and the subjects against the catalog. Returns the level when it is valid.
function checkPilihan(plan: Pilihan, ctx: z.RefinementCtx): CurriculumLevel | undefined {
  const level = findLevel(plan.levelId)
  if (!level) {
    return undefined
  }
  if (!level.grades.includes(plan.grade)) {
    ctx.addIssue({ code: 'custom', path: ['grade'], message: `${level.gradeUnit} ${plan.grade} tidak ada untuk ${level.label}.` })
  }
  const chosenSubjects = new Set<string>()
  plan.subjects.forEach((name, index) => {
    if (!findSubject(level, name)) {
      ctx.addIssue({ code: 'custom', path: ['subjects', index], message: `${name} tidak ada di ${level.label}.` })
    }
    if (chosenSubjects.has(name)) {
      ctx.addIssue({ code: 'custom', path: ['subjects', index], message: `${name} dipilih dua kali.` })
    }
    chosenSubjects.add(name)
  })
  return level
}

// Pilihan for the roadmap request. The branches are made by the server, so there are no branches here yet.
export const pilihanSchema = pilihanFields.superRefine((plan, ctx) => {
  checkPilihan(plan, ctx)
})

// A learning plan: the choices plus the roadmap branches the user accepted. Branch names may come from the AI,
// so they are not checked against the catalog. They must belong to a chosen subject, and their number is 6 to 12.
export const planSchema = pilihanFields
  .extend({
    topics: z
      .array(
        z.object({
          subject: z.string().trim().min(1).max(60),
          name: z.string().trim().min(1).max(60),
        }),
      )
      .min(MIN_CABANG, `Roadmap harus punya ${MIN_CABANG} sampai ${MAX_CABANG} cabang.`)
      .max(MAX_CABANG, `Roadmap harus punya ${MIN_CABANG} sampai ${MAX_CABANG} cabang.`),
  })
  .superRefine((plan, ctx) => {
    checkPilihan(plan, ctx)
    const chosenSubjects = new Set(plan.subjects)
    const chosenNames = new Set<string>()
    plan.topics.forEach((topic, index) => {
      if (!chosenSubjects.has(topic.subject)) {
        ctx.addIssue({ code: 'custom', path: ['topics', index], message: `${topic.name} harus dari mata pelajaran yang dipilih.` })
      }
      const key = normalizeTopicName(topic.name)
      if (chosenNames.has(key)) {
        ctx.addIssue({ code: 'custom', path: ['topics', index], message: `${topic.name} dipilih dua kali.` })
      }
      chosenNames.add(key)
    })
  })

export type PlanInput = z.infer<typeof planSchema>
export type PilihanInput = z.infer<typeof pilihanSchema>
