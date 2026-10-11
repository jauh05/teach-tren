// Topic (bulat) status rules from docs/role.md section 4.1 and CC-04.
// Names are the status codes used by the planned API.

export type TopicStatus = 'DIKUASAI' | 'SEDANG' | 'PERLU_DIULANG' | 'BARU' | 'BELUM_DIBUKA' | 'SARAN'

export interface TopicCondition {
  // Score from the latest practice or quiz. Null when the topic has no exercise yet.
  lastScore: number | null
  // False while the prerequisites are not mastered yet.
  unlocked: boolean
  // True for an AI suggestion that the user has not accepted.
  pendingSuggestion: boolean
}

export const MASTERED_MIN_SCORE = 80
export const LEARNING_MIN_SCORE = 50

export function topicStatusOf(condition: TopicCondition): TopicStatus {
  if (condition.pendingSuggestion) return 'SARAN'
  if (!condition.unlocked) return 'BELUM_DIBUKA'
  if (condition.lastScore === null) return 'BARU'
  if (condition.lastScore >= MASTERED_MIN_SCORE) return 'DIKUASAI'
  if (condition.lastScore >= LEARNING_MIN_SCORE) return 'SEDANG'
  return 'PERLU_DIULANG'
}

export const TOPIC_STATUS_LABEL: Record<TopicStatus, string> = {
  DIKUASAI: 'Sudah dikuasai',
  SEDANG: 'Sedang dipelajari',
  PERLU_DIULANG: 'Perlu diulang',
  BARU: 'Kosong, belum ada latihan',
  BELUM_DIBUKA: 'Belum dibuka',
  SARAN: 'Saran berikutnya',
}
