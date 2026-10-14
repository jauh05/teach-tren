import type { Topic } from '../../domain/types'

// Subject used for a topic without one. The backend uses the same name (backend/src/topics/routes.ts).
export const DEFAULT_SUBJECT = 'Umum'

// Soft accent colors for subject titles, their links, and the ring around each topic. They are muted on purpose, so the
// roadmap stays calm, and they never replace the status colors of the topics.
export const SUBJECT_COLORS = ['#5BA89B', '#6B8FD6', '#D9A05B', '#D47A9E', '#5FA8C0', '#8DB36B'] as const

// Mixes a color with white. `amount` is the share of the color: 0 is white, 1 is the color itself.
export function tintOf(color: string, amount: number): string {
  const channels = [1, 3, 5].map((start) => parseInt(color.slice(start, start + 2), 16))
  const mixed = channels.map((channel) => Math.round(255 - (255 - channel) * amount))
  return `#${mixed.map((channel) => channel.toString(16).padStart(2, '0')).join('')}`
}

// Layout ids of subject titles start with this prefix, so they never clash with topic ids.
const TITLE_PREFIX = 'subject:'

export interface SubjectGroup {
  subject: string
  color: string
  titleId: string
  topicIds: string[]
}

export function subjectOf(topic: Topic): string {
  return topic.subject.trim() || DEFAULT_SUBJECT
}

export function isSubjectTitle(id: string): boolean {
  return id.startsWith(TITLE_PREFIX)
}

// Groups in the order their first topic appears. Each group takes the next color, and the colors repeat after the last one.
export function subjectGroupsOf(topics: Topic[]): SubjectGroup[] {
  const groups = new Map<string, SubjectGroup>()
  for (const topic of topics) {
    const subject = subjectOf(topic)
    const existing = groups.get(subject)
    if (existing) {
      existing.topicIds.push(topic.id)
      continue
    }
    groups.set(subject, {
      subject,
      color: SUBJECT_COLORS[groups.size % SUBJECT_COLORS.length],
      titleId: `${TITLE_PREFIX}${subject}`,
      topicIds: [topic.id],
    })
  }
  return [...groups.values()]
}
