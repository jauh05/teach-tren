import { z } from 'zod'

// Topic names are unique per user, ignoring letter case and surrounding spaces (docs/role.md 6.2). The server checks this.
export const topicNameSchema = z
  .string()
  .trim()
  .min(1, 'Nama bulat tidak boleh kosong.')
  .max(60, 'Nama bulat maksimal 60 karakter.')

export type TopicNameInput = z.infer<typeof topicNameSchema>

const QUESTION_TOPIC_MAX = 60

// The name of a topic made from a chat question: one line, without closing punctuation, at most 60 characters.
// Returns an empty string when nothing is left, so the caller can refuse it.
export function topicNameFromQuestion(question: string): string {
  const oneLine = question.replace(/\s+/g, ' ').trim().replace(/[?!.]+$/, '').trim()
  if (oneLine.length <= QUESTION_TOPIC_MAX) {
    return oneLine
  }
  return `${oneLine.slice(0, QUESTION_TOPIC_MAX - 1).trimEnd()}…`
}
