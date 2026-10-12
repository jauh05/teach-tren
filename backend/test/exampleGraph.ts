import type { PrismaClient } from '../src/generated/prisma/client.js'

// Example graph used only by tests that need fixed topic ids (bilangan, persamaan-linear, and so on).
// It lives in the test folder, so the product never creates example data for an account.
const TOPICS = [
  { id: 'bilangan', name: 'Bilangan', subject: 'Matematika', x: 100, y: 110, lastScore: 90 },
  { id: 'persamaan-linear', name: 'Persamaan linear', subject: 'Matematika', x: 240, y: 110, lastScore: 72 },
  { id: 'fungsi-kuadrat', name: 'Fungsi kuadrat', subject: 'Matematika', x: 380, y: 70 },
  { id: 'sistem-persamaan', name: 'Sistem persamaan', subject: 'Matematika', x: 330, y: 230, unlocked: false },
  { id: 'bangun-datar', name: 'Bangun datar', subject: 'Matematika', x: 110, y: 240, lastScore: 85 },
  { id: 'sel-tumbuhan', name: 'Sel tumbuhan', subject: 'IPA', x: 420, y: 240, lastScore: 38 },
  { id: 'fotosintesis', name: 'Fotosintesis', subject: 'IPA', x: 455, y: 150, unlocked: false },
  { id: 'pertidaksamaan', name: 'Pertidaksamaan', subject: 'Matematika', x: 200, y: 290, pendingSuggestion: true },
  { id: 'grafik-fungsi', name: 'Grafik fungsi', subject: 'Matematika', x: 380, y: 160, pendingSuggestion: true },
]

const LINKS = [
  { sourceId: 'bilangan', targetId: 'persamaan-linear', suggested: false },
  { sourceId: 'persamaan-linear', targetId: 'fungsi-kuadrat', suggested: false },
  { sourceId: 'persamaan-linear', targetId: 'sistem-persamaan', suggested: false },
  { sourceId: 'bilangan', targetId: 'bangun-datar', suggested: false },
  { sourceId: 'sel-tumbuhan', targetId: 'fotosintesis', suggested: false },
  { sourceId: 'bangun-datar', targetId: 'pertidaksamaan', suggested: true },
  { sourceId: 'fungsi-kuadrat', targetId: 'grafik-fungsi', suggested: true },
]

// Replaces the starter topic of an account with the example graph, so the ids above exist for that account.
export async function seedExampleGraph(db: PrismaClient, userId: string): Promise<void> {
  // The learning plan is part of the example account, so Learning opens without the onboarding wizard.
  await db.learningPlan.upsert({
    where: { userId },
    create: { userId, levelId: 'sma', grade: 10, subjects: ['Matematika', 'IPA'] },
    update: {},
  })
  await db.topic.deleteMany({ where: { userId } })
  await db.topic.createMany({ data: TOPICS.map((topic) => ({ ...topic, userId })) })
  await db.topicLink.createMany({ data: LINKS.map((link) => ({ ...link, userId })) })
}
