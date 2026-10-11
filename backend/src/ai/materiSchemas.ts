import { z } from 'zod'

// The answer of the summary task (MATERI_RINGKAS). It is checked before anything is saved.
export const materiSummarySchema = z.object({
  ringkasan: z.array(z.string().trim().min(5).max(300)).min(3).max(5),
  usulanTopik: z.array(z.string().trim().min(2).max(60)).min(1).max(5),
})

export type MateriSummary = z.infer<typeof materiSummarySchema>
