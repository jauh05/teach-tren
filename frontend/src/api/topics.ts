import { z } from 'zod'
import type { Topic, TopicGraph } from '../domain/types'
import { useSessionStore } from '../stores/sessionStore'
import { ApiError, apiRequest } from './http'

// Topics of a signed-in account are read and changed through the backend.
// A guest may add one topic, kept on this device. More topics need an account, and the guest's topic moves to the
// account on sign-in (importGuestTopics). Guests cannot link topics or ask for AI suggestions.
function usesServer(): boolean {
  return useSessionStore.getState().mode === 'signedIn'
}

const SIGN_IN_TO_ADD_MORE = 'Masuk untuk membuat neuron lagi.'
const SIGN_IN_TO_USE = 'Masuk untuk memakai fitur ini.'
const GUEST_TOPIC_KEY = 'teach-tren-pola-tamu'
// Topics a guest may hold on the device: one, made with AI. After that, signing in is needed.
export const GUEST_TOPIC_LIMIT = 1
// Center of the canvas, the same place the backend uses for the first topic.
const GUEST_TOPIC_POSITION = { x: 280, y: 170 }

const graphSchema = z.object({
  topics: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      x: z.number(),
      y: z.number(),
      lastScore: z.number().nullable(),
      unlocked: z.boolean(),
      pendingSuggestion: z.boolean(),
      materials: z.array(z.string()),
    }),
  ),
  links: z.array(z.object({ source: z.string(), target: z.string(), suggested: z.boolean() })),
})

const guestTopicsSchema = z.array(z.object({ id: z.string(), name: z.string(), x: z.number(), y: z.number() }))
const suggestionsSchema = z.object({ saran: z.array(z.object({ nama: z.string(), alasan: z.string() })) })

type GuestTopic = z.infer<typeof guestTopicsSchema>[number]

function encodeId(id: string): string {
  return encodeURIComponent(id)
}

// A guest is identified by the device id, the same as in chat and quizzes.
function identityHeaders(): Record<string, string> | undefined {
  const session = useSessionStore.getState()
  return session.mode === 'guest' ? { 'X-Guest-Id': session.guestId } : undefined
}

// Reads the guest's topic from this device. A damaged value counts as no topic.
function readGuestTopics(): GuestTopic[] {
  try {
    const parsed = guestTopicsSchema.safeParse(JSON.parse(localStorage.getItem(GUEST_TOPIC_KEY) ?? '[]'))
    return parsed.success ? parsed.data : []
  } catch {
    return []
  }
}

function writeGuestTopics(topics: GuestTopic[]): void {
  try {
    localStorage.setItem(GUEST_TOPIC_KEY, JSON.stringify(topics))
  } catch {
    // Storage can be blocked. The topic then lasts for this page only.
  }
}

function sameName(a: string, b: string): boolean {
  return a.trim().toLocaleLowerCase('id-ID') === b.trim().toLocaleLowerCase('id-ID')
}

function toTopic(topic: GuestTopic): Topic {
  return {
    id: topic.id,
    name: topic.name,
    lastScore: null,
    unlocked: true,
    pendingSuggestion: false,
    conversationCount: 0,
    materials: [],
    initialX: topic.x,
    initialY: topic.y,
  }
}

export async function fetchTopicGraph(): Promise<TopicGraph> {
  if (!usesServer()) {
    return { topics: readGuestTopics().map(toTopic), links: [] }
  }
  const data = graphSchema.parse(await apiRequest('GET', '/api/topics'))
  return {
    topics: data.topics.map((topic) => ({
      id: topic.id,
      name: topic.name,
      lastScore: topic.lastScore,
      unlocked: topic.unlocked,
      pendingSuggestion: topic.pendingSuggestion,
      // The backend does not count conversations per topic yet. The UI does not show this value.
      conversationCount: 0,
      materials: topic.materials,
      initialX: topic.x,
      initialY: topic.y,
    })),
    links: data.links.map((link) => ({ source: link.source, target: link.target, suggested: link.suggested })),
  }
}

// Quiz scores update the topic status (docs/role.md 4.1). A missing topic is ignored: quizzes can exist without one.
// Guest topics have no scores, so nothing is stored for guests.
export async function recordTopicScore(topicId: string, percent: number): Promise<void> {
  if (!usesServer()) {
    return
  }
  try {
    await apiRequest('POST', `/api/topics/${encodeId(topicId)}/scores`, { percent })
  } catch (error) {
    // Quizzes can exist without a topic, so a missing topic is ignored here too.
    if (!(error instanceof ApiError && error.status === 404)) {
      throw error
    }
  }
}

export async function renameTopic(topicId: string, name: string): Promise<void> {
  const trimmed = name.trim()
  if (usesServer()) {
    await apiRequest('PATCH', `/api/topics/${encodeId(topicId)}`, { name: trimmed })
    return
  }
  const topics = readGuestTopics()
  if (topics.some((topic) => topic.id !== topicId && sameName(topic.name, trimmed))) {
    throw new Error('Nama neuron sudah dipakai.')
  }
  writeGuestTopics(topics.map((topic) => (topic.id === topicId ? { ...topic, name: trimmed } : topic)))
}

// Creates a pattern and returns its id. With dariId, the new pattern follows that one.
export async function createTopic(name: string, dariId?: string): Promise<string> {
  const trimmed = name.trim()
  if (usesServer()) {
    const data = await apiRequest('POST', '/api/topics', dariId ? { name: trimmed, dariId } : { name: trimmed })
    return z.object({ topic: z.object({ id: z.string() }) }).parse(data).topic.id
  }
  if (dariId) {
    throw new Error(SIGN_IN_TO_USE)
  }
  const topics = readGuestTopics()
  if (topics.length >= GUEST_TOPIC_LIMIT) {
    throw new Error(SIGN_IN_TO_ADD_MORE)
  }
  if (topics.some((topic) => sameName(topic.name, trimmed))) {
    throw new Error('Nama neuron sudah dipakai.')
  }
  const id = crypto.randomUUID()
  writeGuestTopics([...topics, { id, name: trimmed, ...GUEST_TOPIC_POSITION }])
  return id
}

// Links a finished pattern to another one: the first comes before the second.
export async function linkTopics(dariId: string, keId: string): Promise<void> {
  if (!usesServer()) {
    throw new Error(SIGN_IN_TO_USE)
  }
  await apiRequest('POST', '/api/topics/tautan', { dariId, keId })
}

export interface PatternSuggestion {
  nama: string
  alasan: string
}

export interface SuggestInput {
  // A pattern of the account. Signed-in users send the id.
  polaId?: string
  // A pattern on the device. Guests send the name, because the pattern is not on the server.
  nama?: string
  // What the user wants to learn.
  tujuan?: string
  sudahAda?: string[]
}

// Patterns that could come next. Nothing is created until the user accepts one.
// Guests can use this once or twice (the guest AI quota), with a goal or with the name of their pattern.
export async function suggestPatterns(input: SuggestInput): Promise<PatternSuggestion[]> {
  const body = usesServer() ? input : { nama: input.nama, tujuan: input.tujuan, sudahAda: input.sudahAda }
  return suggestionsSchema.parse(await apiRequest('POST', '/api/topics/saran', body, identityHeaders())).saran
}

export interface MateriPart {
  id: string
  position: number
  judul: string
  isi: string
}

const materiPartSchema = z.object({ id: z.string(), position: z.number(), judul: z.string(), isi: z.string() })

// Study material of a pattern, one part at a time. Only accounts have it.
export async function fetchMateriParts(topicId: string): Promise<MateriPart[]> {
  if (!usesServer()) {
    return []
  }
  return z.object({ materi: z.array(materiPartSchema) }).parse(await apiRequest('GET', `/api/topics/${encodeId(topicId)}/materi-ai`)).materi
}

// Writes the next part of the material. One call gives one part.
export async function generateMateriPart(topicId: string): Promise<MateriPart> {
  if (!usesServer()) {
    throw new Error(SIGN_IN_TO_USE)
  }
  return z.object({ materi: materiPartSchema }).parse(await apiRequest('POST', `/api/topics/${encodeId(topicId)}/materi-ai`)).materi
}

// Moves the guest's topic to the account after sign-in. A name the account already has is skipped.
export async function importGuestTopics(): Promise<void> {
  const topics = readGuestTopics()
  for (const topic of topics) {
    try {
      await apiRequest('POST', '/api/topics', { name: topic.name })
    } catch (error) {
      if (!(error instanceof ApiError && error.status === 409)) {
        throw error
      }
    }
  }
  if (topics.length > 0) {
    writeGuestTopics([])
  }
}
