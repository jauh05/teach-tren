// Shared domain types. Keep field names aligned with the planned API contract (docs/api.md).

export interface Conversation {
  id: string
  title: string
  // ISO 8601 timestamp of the last activity.
  updatedAt: string
}
