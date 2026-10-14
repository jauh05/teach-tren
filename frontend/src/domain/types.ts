import type { TopicStatus } from './topicStatus'

// Shared domain types. Keep field names aligned with the planned API contract (docs/api.md).

export interface Conversation {
  id: string
  title: string
  // ISO 8601 timestamp of the last activity.
  updatedAt: string
}

export type MessageRole = 'user' | 'assistant'

// 'streaming' while the answer arrives, 'done' when complete, 'stopped' when the user cancelled.
export type MessageStatus = 'done' | 'streaming' | 'stopped'

export interface ChatMessage {
  id: string
  role: MessageRole
  content: string
  status: MessageStatus
}

// Learning memory: topics the user has already studied, with their latest score.
export interface MemoryEntry {
  id: string
  topicName: string
  status: TopicStatus
  lastScore: number | null
  // Calendar date of the last update, YYYY-MM-DD.
  date: string
}

// A learning topic (neuron). Status is derived from these fields with topicStatusOf.
export interface Topic {
  id: string
  name: string
  // Mata pelajaran of the topic, for example Matematika. Topics without one are "Umum". The canvas titles groups with it.
  subject: string
  lastScore: number | null
  unlocked: boolean
  pendingSuggestion: boolean
  conversationCount: number
  materials: string[]
  // Starting position on the canvas, in world units. Positions are not saved (docs/role.md 4.1).
  initialX: number
  initialY: number
}

export interface TopicLink {
  source: string
  target: string
  // Dashed links connect to a suggested topic.
  suggested: boolean
}

export interface TopicGraph {
  topics: Topic[]
  links: TopicLink[]
}
