import type { Prisma } from '../generated/prisma/client.js'

// Starting graph for every new account. Positions match the mockup (docs/design/html/02-learning-desktop.html).
const TOPICS: Omit<Prisma.TopicCreateManyInput, 'userId'>[] = [
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

const LINKS: { sourceId: string; targetId: string; suggested: boolean }[] = [
  { sourceId: 'bilangan', targetId: 'persamaan-linear', suggested: false },
  { sourceId: 'persamaan-linear', targetId: 'fungsi-kuadrat', suggested: false },
  { sourceId: 'persamaan-linear', targetId: 'sistem-persamaan', suggested: false },
  { sourceId: 'bilangan', targetId: 'bangun-datar', suggested: false },
  { sourceId: 'sel-tumbuhan', targetId: 'fotosintesis', suggested: false },
  { sourceId: 'bangun-datar', targetId: 'pertidaksamaan', suggested: true },
  { sourceId: 'fungsi-kuadrat', targetId: 'grafik-fungsi', suggested: true },
]

// The demo account of the mockup (docs/role.md CC-01): six topics and five links.
const DEMO_TOPIC_IDS = ['bilangan', 'persamaan-linear', 'fungsi-kuadrat', 'bangun-datar', 'sel-tumbuhan', 'pertidaksamaan']
// The fifth link is not in the default graph, so the demo links are written out here.
const DEMO_LINKS: { sourceId: string; targetId: string; suggested: boolean }[] = [
  { sourceId: 'bilangan', targetId: 'persamaan-linear', suggested: false },
  { sourceId: 'persamaan-linear', targetId: 'fungsi-kuadrat', suggested: false },
  { sourceId: 'bilangan', targetId: 'bangun-datar', suggested: false },
  { sourceId: 'bangun-datar', targetId: 'pertidaksamaan', suggested: true },
  { sourceId: 'fungsi-kuadrat', targetId: 'pertidaksamaan', suggested: true },
]

export async function seedDemoGraph(tx: Prisma.TransactionClient, userId: string): Promise<void> {
  const topics = TOPICS.filter((topic) => DEMO_TOPIC_IDS.includes(topic.id ?? ''))
  await tx.topic.createMany({ data: topics.map((topic) => ({ ...topic, userId })) })
  await tx.topicLink.createMany({ data: DEMO_LINKS.map((link) => ({ ...link, userId })) })
}

export async function seedDefaultTopics(tx: Prisma.TransactionClient, userId: string): Promise<void> {
  await tx.topic.createMany({ data: TOPICS.map((topic) => ({ ...topic, userId })) })
  await tx.topicLink.createMany({ data: LINKS.map((link) => ({ ...link, userId })) })
}
