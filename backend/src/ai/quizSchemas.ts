import { z } from 'zod'

// Output of P-AI-02 (task KUIS_GENERATE). The checks here are the ones a wrong answer key would break:
// four distinct options, a key that exists, and a rubric that adds up to 100.
export const LETTERS = ['A', 'B', 'C', 'D'] as const
export const QUESTION_TYPES = ['PG', 'CERITA', 'ISIAN', 'ESAI'] as const

const stimulusItem = z.object({
  id: z.string().trim().min(1).max(20),
  teks: z.string().trim().min(40).max(2000),
})

const optionItem = z.object({
  huruf: z.enum(LETTERS),
  teks: z.string().trim().min(1).max(300),
})

const rubricItem = z.object({
  poin: z.string().trim().min(1).max(200),
  bobot: z.number().int().min(1).max(100),
})

const questionItem = z.object({
  nomor: z.number().int().optional(),
  tipe: z.enum(QUESTION_TYPES),
  stimulusId: z.string().trim().min(1).nullable(),
  pertanyaan: z.string().trim().min(5).max(1500),
  pilihan: z.array(optionItem).nullable(),
  kunci: z.string().trim().nullable(),
  rubrik: z.array(rubricItem).nullable(),
  pembahasan: z.string().trim().min(3).max(1000),
})

// Normalized text, so "5" and " 5 " are the same option.
function sameText(a: string, b: string): boolean {
  return a.trim().toLocaleLowerCase('id-ID') === b.trim().toLocaleLowerCase('id-ID')
}

export function kuisBatchSchema(jumlah: number) {
  return z
    .object({
      stimulus: z.array(stimulusItem).max(5),
      soal: z.array(questionItem),
    })
    .superRefine((batch, ctx) => {
      if (batch.soal.length !== jumlah) {
        ctx.addIssue({ code: 'custom', message: `Jumlah soal harus ${jumlah}.`, path: ['soal'] })
      }
      const stimulusIds = new Set(batch.stimulus.map((item) => item.id))
      batch.soal.forEach((question, index) => {
        const fail = (message: string) => ctx.addIssue({ code: 'custom', message, path: ['soal', index] })
        if (question.stimulusId !== null && !stimulusIds.has(question.stimulusId)) {
          fail(`stimulusId ${question.stimulusId} tidak ada di daftar stimulus.`)
        }
        if (question.tipe === 'PG' || question.tipe === 'CERITA') {
          const options = question.pilihan ?? []
          if (options.length !== 4) {
            fail('Soal pilihan ganda harus punya tepat empat pilihan.')
          } else {
            if (options.map((option) => option.huruf).join('') !== 'ABCD') {
              fail('Pilihan harus A sampai D berurutan.')
            }
            const distinct = options.every((option, position) =>
              options.every((other, otherPosition) => position === otherPosition || !sameText(option.teks, other.teks)),
            )
            if (!distinct) {
              fail('Keempat pilihan harus berbeda.')
            }
          }
          if (question.kunci === null || !(LETTERS as readonly string[]).includes(question.kunci)) {
            fail('Kunci soal pilihan ganda harus A, B, C, atau D.')
          }
          if (question.rubrik !== null) {
            fail('Rubrik hanya untuk soal esai.')
          }
        } else if (question.tipe === 'ISIAN') {
          if (!question.kunci) {
            fail('Soal isian harus punya kunci jawaban.')
          }
          if (question.pilihan !== null) {
            fail('Soal isian tidak punya pilihan.')
          }
        } else {
          if (question.pilihan !== null) {
            fail('Soal esai tidak punya pilihan.')
          }
          const rubric = question.rubrik ?? []
          if (rubric.length < 3 || rubric.length > 5) {
            fail('Rubrik esai harus 3 sampai 5 poin.')
          }
          if (rubric.reduce((sum, item) => sum + item.bobot, 0) !== 100) {
            fail('Bobot rubrik esai harus berjumlah 100.')
          }
        }
      })
    })
}

export type KuisBatch = z.infer<ReturnType<typeof kuisBatchSchema>>

// Output of P-AI-08 (task NILAI_ESAI). The ids must be the ones that were sent.
export const essayGradingSchema = z.object({
  hasil: z.array(
    z.object({
      id: z.string().min(1),
      skor: z.number().int().min(0).max(100),
      umpanBalik: z.string().trim().min(1).max(400),
      keyakinan: z.enum(['TINGGI', 'SEDANG', 'RENDAH']),
    }),
  ),
})

export type EssayGrading = z.infer<typeof essayGradingSchema>

// Output of the key check (task VERIFIKASI_KUNCI). "benar" false means the key does not match the question.
export const verificationSchema = z.object({
  hasil: z.array(
    z.object({
      nomor: z.number().int(),
      benar: z.boolean(),
      jawabanBenar: z.string(),
    }),
  ),
})

export type Verification = z.infer<typeof verificationSchema>
