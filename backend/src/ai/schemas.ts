import { z } from 'zod'

// Output of the JADWAL_SARAN task (P-AI-05). Every model's answer must match this before it is used.
export const WEEKDAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'] as const

export const scheduleSuggestionsSchema = z.object({
  saran: z
    .array(
      z.object({
        hari: z.enum(WEEKDAYS),
        topik: z.string().min(1).max(60),
        jenis: z.enum(['LATIHAN', 'ULANG', 'BARU']),
        alasan: z.string().min(1).max(200),
      }),
    )
    .max(5),
})

export type ScheduleSuggestions = z.infer<typeof scheduleSuggestionsSchema>

export const polaSuggestionsSchema = z.object({
  saran: z
    .array(
      z.object({
        nama: z.string().min(1).max(60),
        alasan: z.string().min(1).max(160),
      }),
    )
    .min(1)
    .max(5),
})

export type PolaSuggestions = z.infer<typeof polaSuggestionsSchema>
