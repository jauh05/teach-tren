import type { Prisma } from '../generated/prisma/client.js'

// Starting graph for every new account. Positions match the mockup (docs/design/html/02-learning-desktop.html).
const TOPICS: Omit<Prisma.TopicCreateManyInput, 'userId'>[] = [
  { id: 'bilangan', name: 'Bilangan', x: 100, y: 110, lastScore: 90 },
  { id: 'persamaan-linear', name: 'Persamaan linear', x: 240, y: 110, lastScore: 72 },
  { id: 'fungsi-kuadrat', name: 'Fungsi kuadrat', x: 380, y: 70 },
  { id: 'sistem-persamaan', name: 'Sistem persamaan', x: 330, y: 230, unlocked: false },
  { id: 'bangun-datar', name: 'Bangun datar', x: 110, y: 240, lastScore: 85 },
  { id: 'sel-tumbuhan', name: 'Sel tumbuhan', x: 420, y: 240, lastScore: 38 },
  { id: 'fotosintesis', name: 'Fotosintesis', x: 455, y: 150, unlocked: false },
  { id: 'pertidaksamaan', name: 'Pertidaksamaan', x: 200, y: 290, pendingSuggestion: true },
  { id: 'grafik-fungsi', name: 'Grafik fungsi', x: 380, y: 160, pendingSuggestion: true },
]

const LINKS: { sourceId: string; targetId: string; suggested: boolean }[] = [
  { sourceId: 'bilangan', targetId: 'persamaan-linear', suggested: false },
  { sourceId: 'persamaan-linear', targetId: 'fungsi-kuadrat', suggested: false },
  { sourceId: 'persamaan-linear', targetId: 'sistem-persamaan', suggested: false },
  { sourceId: 'bilangan', targetId: 'bangun-datar', suggested: false },
  { sourceId: 'sel-tumbuhan', targetId: 'fotosintesis', suggested: false },
  { sourceId: 'bangun-datar', targetId: 'pertidaksamaan', suggested: true },
  { sourceId: 'fungsi-kuadrat', targetId: 'grafik-fungsi', suggested: true },
]

export async function seedDefaultTopics(tx: Prisma.TransactionClient, userId: string): Promise<void> {
  await tx.topic.createMany({ data: TOPICS.map((topic) => ({ ...topic, userId })) })
  await tx.topicLink.createMany({ data: LINKS.map((link) => ({ ...link, userId })) })
}
