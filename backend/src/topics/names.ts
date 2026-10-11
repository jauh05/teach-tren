import { z } from 'zod'

// Topic names are unique per user, ignoring letter case and surrounding spaces (docs/role.md 6.2).
export function normalizeTopicName(name: string): string {
  return name.trim().toLocaleLowerCase('id-ID')
}

export const topicNameSchema = z
  .string()
  .trim()
  .min(1, 'Nama bulat tidak boleh kosong.')
  .max(60, 'Nama bulat maksimal 60 karakter.')
