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
