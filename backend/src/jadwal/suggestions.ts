import { ai } from '../ai/index.js'
import { scheduleSystemPrompt } from '../ai/prompts.js'
import { scheduleSuggestionsSchema, type ScheduleSuggestions, WEEKDAYS } from '../ai/schemas.js'
import { prisma } from '../db.js'
import { logger } from '../logger.js'
import { dateKey, dateOfWeekday } from './dates.js'
import { buildMemory, memoryHash, type MemoryEntry } from './memory.js'

const MAX_SUGGESTIONS = 5

// Mock output for AI_MODE=mock. It is built only from the user's scores and from suggested links of the topic graph.
export function mockScheduleOutput(entries: MemoryEntry[], suggestedLinks: { source: string; target: string }[], names: Map<string, string>): ScheduleSuggestions {
  const candidates: ScheduleSuggestions['saran'] = []
  for (const link of suggestedLinks) {
    candidates.push({
      hari: 'Senin',
      topik: names.get(link.target) ?? link.target,
      jenis: 'BARU',
      alasan: `Saran AI dari topik ${names.get(link.source) ?? link.source}`,
    })
  }
  for (const entry of entries.filter((item) => item.status === 'PERLU_DIULANG')) {
    candidates.push({ hari: 'Senin', topik: entry.topicName, jenis: 'ULANG', alasan: `Karena skor ${entry.lastScore} pada ${entry.topicName}` })
  }
  for (const entry of entries.filter((item) => item.status === 'SEDANG')) {
    candidates.push({ hari: 'Senin', topik: entry.topicName, jenis: 'LATIHAN', alasan: `Skor ${entry.lastScore} pada ${entry.topicName}` })
  }
  // Spread the suggestions over different days, in this order.
  const spread = [0, 3, 1, 2, 4]
  return {
    saran: candidates.slice(0, MAX_SUGGESTIONS).map((item, index) => ({ ...item, hari: WEEKDAYS[spread[index]] })),
  }
}

// Builds this week's suggestions for a user, at most once a day. The AI is skipped when the memory did not change.
export async function refreshSuggestions(userId: string, now: Date = new Date()): Promise<void> {
  const runDate = dateKey(now)
  const entries = await buildMemory(userId)
  const hash = memoryHash(entries)

  const previous = await prisma.scheduleRun.findFirst({ where: { userId }, orderBy: { runDate: 'desc' } })
  try {
    await prisma.scheduleRun.create({ data: { userId, runDate, memoryHash: hash } })
  } catch {
    // Already ran today.
    return
  }
  if (previous?.memoryHash === hash) {
    return
  }

  const topics = await prisma.topic.findMany({ where: { userId }, select: { id: true, name: true } })
  const names = new Map(topics.map((topic) => [topic.id, topic.name]))
  const links = await prisma.topicLink.findMany({ where: { userId, suggested: true } })
  const suggestedLinks = links.map((link) => ({ source: link.sourceId, target: link.targetId }))

  try {
    const result = await ai.complete({
      task: 'JADWAL_SARAN',
      system: scheduleSystemPrompt(
        JSON.stringify({
          ingatan: entries.map((entry) => ({ topik: entry.topicName, status: entry.status, skor: entry.lastScore })),
          saranTopik: suggestedLinks.map((link) => ({
            dari: names.get(link.source) ?? '',
            ke: names.get(link.target) ?? '',
          })),
        }),
      ),
      user: 'Susun saran belajar untuk minggu ini.',
      schema: scheduleSuggestionsSchema,
      mock: () => JSON.stringify(mockScheduleOutput(entries, suggestedLinks, names)),
    })
    await prisma.$transaction([
      prisma.scheduleItem.deleteMany({ where: { userId, kind: 'SARAN' } }),
      prisma.scheduleItem.createMany({
        data: result.saran.map((item) => ({
          userId,
          date: dateOfWeekday(item.hari, now),
          title: titleOf(item.jenis, item.topik),
          kind: 'SARAN' as const,
          reason: item.alasan,
        })),
      }),
    ])
  } catch (error) {
    // Nothing was saved, so the run is removed and the next visit can try again.
    await prisma.scheduleRun.delete({ where: { userId_runDate: { userId, runDate } } }).catch(() => undefined)
    logger.warn({ reason: error instanceof Error ? error.name : 'kesalahan' }, 'Saran jadwal belum dibuat')
  }
}

function titleOf(kind: 'LATIHAN' | 'ULANG' | 'BARU', topic: string): string {
  if (kind === 'ULANG') {
    return `Ulangi ${topic}`
  }
  if (kind === 'LATIHAN') {
    return `Latihan ${topic}`
  }
  return topic
}
