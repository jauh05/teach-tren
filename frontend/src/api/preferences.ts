import { z } from 'zod'
import type { Preferences } from '../stores/preferencesStore'
import { apiRequest } from './http'

// Study preferences of a signed-in user (docs/api.md, Pengaturan). Guests keep them on the device only.
const preferencesSchema = z.object({
  questionCount: z.union([z.literal(5), z.literal(10), z.literal(15), z.literal(20)]),
  level: z.enum(['Mudah', 'Sedang', 'Sulit']),
  quizStyle: z.enum(['Campuran', 'Pilihan ganda saja', 'Banyak cerita']),
  quickChoiceAfterMaterial: z.boolean(),
  theme: z.enum(['light', 'system']),
  reminderEnabled: z.boolean(),
  reminderTime: z.string(),
})

export async function fetchPreferences(): Promise<Preferences> {
  return preferencesSchema.parse((await apiRequest('GET', '/api/pengaturan/preferensi') as { preferensi: unknown }).preferensi)
}

export async function savePreferences(preferences: Preferences): Promise<void> {
  await apiRequest('PUT', '/api/pengaturan/preferensi', preferences)
}
