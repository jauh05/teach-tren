import { z } from 'zod'

// Output of P-AI-02 (task KUIS_GENERATE). The checks here are the ones a wrong answer key would break:
// four distinct options, a key that exists, and a rubric that adds up to 100.
export const LETTERS = ['A', 'B', 'C', 'D'] as const
export const QUESTION_TYPES = ['PG', 'CERITA', 'ISIAN', 'ESAI'] as const

export const stimulusItem = z.object({
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

export const questionItem = z.object({
  nomor: z.number().int().optional(),
  tipe: z.enum(QUESTION_TYPES),
  stimulusId: z.string().trim().min(1).nullable(),
  pertanyaan: z.string().trim().min(5).max(1500),
  pilihan: z.array(optionItem).nullable(),
  kunci: z.string().trim().nullable(),
  rubrik: z.array(rubricItem).nullable(),
  pembahasan: z.string().trim().min(3).max(1000),
})

export type StimulusItem = z.infer<typeof stimulusItem>
export type QuestionItem = z.infer<typeof questionItem>

// Normalized text, so "5" and " 5 " are the same option.
function sameText(a: string, b: string): boolean {
  return a.trim().toLocaleLowerCase('id-ID') === b.trim().toLocaleLowerCase('id-ID')
}

// Every rule one question must follow. The list is empty when the question is fine.
export function questionProblems(question: QuestionItem, stimulusIds: Set<string>): string[] {
  const problems: string[] = []
  if (question.stimulusId !== null && !stimulusIds.has(question.stimulusId)) {
    problems.push(`stimulusId ${question.stimulusId} tidak ada di daftar stimulus.`)
  }
  if (question.tipe === 'PG' || question.tipe === 'CERITA') {
    const options = question.pilihan ?? []
    if (options.length !== 4) {
      problems.push('Soal pilihan ganda harus punya tepat empat pilihan.')
    } else {
      if (options.map((option) => option.huruf).join('') !== 'ABCD') {
        problems.push('Pilihan harus A sampai D berurutan.')
      }
      const distinct = options.every((option, position) =>
        options.every((other, otherPosition) => position === otherPosition || !sameText(option.teks, other.teks)),
      )
      if (!distinct) {
        problems.push('Keempat pilihan harus berbeda.')
      }
    }
    if (question.kunci === null || !(LETTERS as readonly string[]).includes(question.kunci)) {
      problems.push('Kunci soal pilihan ganda harus A, B, C, atau D.')
    }
    if (question.rubrik !== null) {
      problems.push('Rubrik hanya untuk soal esai.')
    }
  } else if (question.tipe === 'ISIAN') {
    if (!question.kunci) {
      problems.push('Soal isian harus punya kunci jawaban.')
    }
    if (question.pilihan !== null) {
      problems.push('Soal isian tidak punya pilihan.')
    }
  } else {
    if (question.pilihan !== null) {
      problems.push('Soal esai tidak punya pilihan.')
    }
    const rubric = question.rubrik ?? []
    if (rubric.length < 3 || rubric.length > 5) {
      problems.push('Rubrik esai harus 3 sampai 5 poin.')
    }
    if (rubric.reduce((sum, item) => sum + item.bobot, 0) !== 100) {
      problems.push('Bobot rubrik esai harus berjumlah 100.')
    }
  }
  return problems
}

// A whole batch must be exactly right. Used by tests and by any caller that wants the strict rule.
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
        for (const message of questionProblems(question, stimulusIds)) {
          ctx.addIssue({ code: 'custom', message, path: ['soal', index] })
        }
      })
    })
}

export type KuisBatch = z.infer<ReturnType<typeof kuisBatchSchema>>

// Quiz batches are read question by question. A question that breaks a rule is dropped, and the rest are kept, so one
// bad question no longer throws away four good ones. The quiz asks again for the missing questions in the next round.
// When `kinds` is given, a question of a type that was not asked for is dropped, and no type gets more than asked.
// That keeps the style the user chose (for example only multiple choice).
// Returns the questions that pass, at most `jumlah` of them, and how many were dropped.
export function salvageBatch(
  value: unknown,
  jumlah: number,
  kinds?: Record<(typeof QUESTION_TYPES)[number], number>,
): { batch: KuisBatch; dropped: number } {
  const object = (typeof value === 'object' && value !== null ? value : {}) as { stimulus?: unknown; soal?: unknown }
  const stimulus: StimulusItem[] = []
  if (Array.isArray(object.stimulus)) {
    for (const item of object.stimulus) {
      const parsed = stimulusItem.safeParse(item)
      if (parsed.success && stimulus.length < 5) {
        stimulus.push(parsed.data)
      }
    }
  }
  const stimulusIds = new Set(stimulus.map((item) => item.id))
  const soal: QuestionItem[] = []
  const taken: Record<string, number> = {}
  let dropped = 0
  for (const item of Array.isArray(object.soal) ? object.soal : []) {
    const parsed = questionItem.safeParse(item)
    if (!parsed.success || questionProblems(parsed.data, stimulusIds).length > 0) {
      dropped += 1
      continue
    }
    const type = parsed.data.tipe
    if (kinds && (taken[type] ?? 0) >= (kinds[type] ?? 0)) {
      dropped += 1
      continue
    }
    if (soal.length < jumlah) {
      soal.push(parsed.data)
      taken[type] = (taken[type] ?? 0) + 1
    }
  }
  return { batch: { stimulus, soal }, dropped }
}

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
