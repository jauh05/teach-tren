import { z } from 'zod'

// Topic names are unique per user, ignoring letter case and surrounding spaces (docs/role.md 6.2).
export function isTopicNameTaken(
  topics: ReadonlyArray<{ id: string; name: string }>,
  name: string,
  exceptId: string,
): boolean {
  const normalized = normalizeName(name)
  return topics.some((topic) => topic.id !== exceptId && normalizeName(topic.name) === normalized)
}

function normalizeName(name: string): string {
  return name.trim().toLocaleLowerCase('id-ID')
}

export const topicNameSchema = z
  .string()
  .trim()
  .min(1, 'Nama bulat tidak boleh kosong.')
  .max(60, 'Nama bulat maksimal 60 karakter.')

export type TopicNameInput = z.infer<typeof topicNameSchema>
