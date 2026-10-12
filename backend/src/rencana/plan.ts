import { z } from 'zod'
import { findLevel, findSubject, LEVEL_IDS } from '../kurikulum/catalog.js'

export const MAX_SUBJECTS = 6
export const MAX_TOPICS = 60

// A learning plan: the level, the grade, the subjects, and the materials the user picked. Every choice is checked
// against the curriculum catalog, so the client cannot save a subject or material the level does not have.
export const planSchema = z
  .object({
    levelId: z.enum(LEVEL_IDS, 'Pilih jenjang: SD, SMP, SMA, atau Kuliah.'),
    grade: z.number().int('Pilih kelas atau semester.'),
    subjects: z
      .array(z.string().trim().min(1).max(60))
      .min(1, 'Pilih minimal satu mata pelajaran.')
      .max(MAX_SUBJECTS, `Pilih paling banyak ${MAX_SUBJECTS} mata pelajaran.`),
    // Materials are optional. The user may skip this step and add them later.
    topics: z
      .array(
        z.object({
          subject: z.string().trim().min(1).max(60),
          name: z.string().trim().min(1).max(60),
        }),
      )
      .max(MAX_TOPICS, `Pilih paling banyak ${MAX_TOPICS} materi.`),
  })
  .superRefine((plan, ctx) => {
    const level = findLevel(plan.levelId)
    if (!level) {
      return
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

    const chosenTopics = new Set<string>()
    plan.topics.forEach((topic, index) => {
      const subject = findSubject(level, topic.subject)
      if (!chosenSubjects.has(topic.subject)) {
        ctx.addIssue({ code: 'custom', path: ['topics', index], message: `${topic.name} harus dari mata pelajaran yang dipilih.` })
        return
      }
      if (!subject?.topics.includes(topic.name)) {
        ctx.addIssue({ code: 'custom', path: ['topics', index], message: `${topic.name} tidak ada di ${topic.subject}.` })
      }
      const key = `${topic.subject}|${topic.name}`
      if (chosenTopics.has(key)) {
        ctx.addIssue({ code: 'custom', path: ['topics', index], message: `${topic.name} dipilih dua kali.` })
      }
      chosenTopics.add(key)
    })
  })

export type PlanInput = z.infer<typeof planSchema>
