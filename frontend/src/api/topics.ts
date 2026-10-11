import { isTopicNameTaken } from '../domain/topicNames'
import type { TopicGraph } from '../domain/types'

// Mock data until the backend exists. Renames are kept in memory and reset on reload.
// Positions come from the mockup (docs/design/html/02-learning-desktop.html), in world units.
const graph: TopicGraph = {
  topics: [
    {
      id: 'bilangan',
      name: 'Bilangan',
      lastScore: 90,
      unlocked: true,
      pendingSuggestion: false,
      conversationCount: 2,
      materials: ['Bilangan bulat dan pecahan'],
      initialX: 100,
      initialY: 110,
    },
    {
      id: 'persamaan-linear',
      name: 'Persamaan linear',
      lastScore: 72,
      unlocked: true,
      pendingSuggestion: false,
      conversationCount: 3,
      materials: ['Modul persamaan linear satu variabel'],
      initialX: 240,
      initialY: 110,
    },
    {
      id: 'fungsi-kuadrat',
      name: 'Fungsi kuadrat',
      lastScore: null,
      unlocked: true,
      pendingSuggestion: false,
      conversationCount: 1,
      materials: [],
      initialX: 380,
      initialY: 70,
    },
    {
      id: 'sistem-persamaan',
      name: 'Sistem persamaan',
      lastScore: null,
      unlocked: false,
      pendingSuggestion: false,
      conversationCount: 0,
      materials: [],
      initialX: 330,
      initialY: 230,
    },
    {
      id: 'bangun-datar',
      name: 'Bangun datar',
      lastScore: 85,
      unlocked: true,
      pendingSuggestion: false,
      conversationCount: 2,
      materials: ['Bangun datar dan luasnya'],
      initialX: 110,
      initialY: 240,
    },
    {
      id: 'sel-tumbuhan',
      name: 'Sel tumbuhan',
      lastScore: 38,
      unlocked: true,
      pendingSuggestion: false,
      conversationCount: 1,
      materials: [],
      initialX: 420,
      initialY: 240,
    },
    {
      id: 'fotosintesis',
      name: 'Fotosintesis',
      lastScore: null,
      unlocked: false,
      pendingSuggestion: false,
      conversationCount: 0,
      materials: [],
      initialX: 455,
      initialY: 150,
    },
    {
      id: 'pertidaksamaan',
      name: 'Pertidaksamaan',
      lastScore: null,
      unlocked: true,
      pendingSuggestion: true,
      conversationCount: 0,
      materials: [],
      initialX: 200,
      initialY: 290,
    },
    {
      id: 'grafik-fungsi',
      name: 'Grafik fungsi',
      lastScore: null,
      unlocked: true,
      pendingSuggestion: true,
      conversationCount: 0,
      materials: [],
      initialX: 380,
      initialY: 160,
    },
  ],
  links: [
    { source: 'bilangan', target: 'persamaan-linear', suggested: false },
    { source: 'persamaan-linear', target: 'fungsi-kuadrat', suggested: false },
    { source: 'persamaan-linear', target: 'sistem-persamaan', suggested: false },
    { source: 'bilangan', target: 'bangun-datar', suggested: false },
    { source: 'sel-tumbuhan', target: 'fotosintesis', suggested: false },
    { source: 'bangun-datar', target: 'pertidaksamaan', suggested: true },
    { source: 'fungsi-kuadrat', target: 'grafik-fungsi', suggested: true },
  ],
}

// Returns copies so callers cannot mutate the stored graph directly.
export async function fetchTopicGraph(): Promise<TopicGraph> {
  return structuredClone(graph)
}

// Quiz scores update the topic status (docs/role.md 4.1). A missing topic is ignored: quizzes can exist without one.
export async function recordTopicScore(topicId: string, percent: number): Promise<void> {
  const topic = graph.topics.find((item) => item.id === topicId)
  if (topic) {
    topic.lastScore = percent
  }
}

export async function renameTopic(topicId: string, name: string): Promise<void> {
  const trimmed = name.trim()
  if (isTopicNameTaken(graph.topics, trimmed, topicId)) {
    throw new Error('Nama sudah dipakai bulat lain.')
  }
  const topic = graph.topics.find((item) => item.id === topicId)
  if (!topic) {
    throw new Error('Bulat tidak ditemukan.')
  }
  topic.name = trimmed
}

// Creates a topic from a material suggestion. Returns the new topic id.
export async function createTopic(name: string): Promise<string> {
  const trimmed = name.trim()
  if (isTopicNameTaken(graph.topics, trimmed, '')) {
    throw new Error('Nama sudah dipakai bulat lain.')
  }
  const slug = trimmed
    .toLocaleLowerCase('id-ID')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  let id = slug || 'topik-baru'
  let suffix = 2
  while (graph.topics.some((topic) => topic.id === id)) {
    id = `${slug}-${suffix}`
    suffix += 1
  }
  // New topics appear in a free area around the center of the seed layout.
  const index = graph.topics.length
  graph.topics.push({
    id,
    name: trimmed,
    lastScore: null,
    unlocked: true,
    pendingSuggestion: false,
    conversationCount: 0,
    materials: [],
    initialX: 150 + ((index * 73) % 260),
    initialY: 60 + ((index * 97) % 240),
  })
  return id
}

// Links a material title to a topic, so the topic lists it under "Materi terkait".
export async function addTopicMaterial(topicId: string, materialTitle: string): Promise<void> {
  const topic = graph.topics.find((item) => item.id === topicId)
  if (!topic) {
    throw new Error('Bulat tidak ditemukan.')
  }
  if (!topic.materials.includes(materialTitle)) {
    topic.materials.push(materialTitle)
  }
}
