import { createHash } from 'node:crypto'
import { prisma } from '../db.js'
import { dateKey } from './dates.js'

// Status thresholds from docs/role.md 4.1 (the same as the browser).
export const MASTERED_MIN_SCORE = 80
export const LEARNING_MIN_SCORE = 50

export type MemoryStatus = 'DIKUASAI' | 'SEDANG' | 'PERLU_DIULANG'

export interface MemoryEntry {
  id: string
  topicName: string
  status: MemoryStatus
  lastScore: number
  // Date of the latest finished quiz, YYYY-MM-DD.
  date: string
}

export function statusOf(score: number): MemoryStatus {
  if (score >= MASTERED_MIN_SCORE) {
    return 'DIKUASAI'
  }
  if (score >= LEARNING_MIN_SCORE) {
    return 'SEDANG'
  }
  return 'PERLU_DIULANG'
}

// Memory is built from the scores of the user's topics. Only topic names and scores are used, never personal data.
export async function buildMemory(userId: string): Promise<MemoryEntry[]> {
  const topics = await prisma.topic.findMany({
    where: { userId, lastScore: { not: null } },
    include: { attempts: { orderBy: { createdAt: 'desc' }, take: 1 } },
    orderBy: { createdAt: 'asc' },
  })
  return topics.map((topic) => ({
    id: topic.id,
    topicName: topic.name,
    status: statusOf(topic.lastScore ?? 0),
    lastScore: topic.lastScore ?? 0,
    date: dateKey(topic.attempts[0]?.createdAt ?? topic.createdAt),
  }))
}

// Fingerprint of what the suggestions depend on. It changes only when a score or a topic name changes.
export function memoryHash(entries: MemoryEntry[]): string {
  const stable = entries.map((entry) => `${entry.id}|${entry.topicName}|${entry.lastScore}`).join('\n')
  return createHash('sha256').update(stable).digest('hex')
}
