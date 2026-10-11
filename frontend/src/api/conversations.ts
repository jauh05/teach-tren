import { z } from 'zod'
import type { ChatMessage, Conversation, MessageStatus } from '../domain/types'
import { useSessionStore } from '../stores/sessionStore'
import { ApiError, apiRequest } from './http'

// Mock data until the backend exists. Replace this module with real requests later.
interface SeedConversation {
  id: string
  title: string
  daysAgo: number
}

interface SeedMessage {
  role: ChatMessage['role']
  content: string
}

const SEED: SeedConversation[] = [
  { id: 'persamaan-linear', title: 'Persamaan linear', daysAgo: 0 },
  { id: 'sel-tumbuhan', title: 'Sel tumbuhan', daysAgo: 0 },
  { id: 'proklamasi-kemerdekaan', title: 'Proklamasi kemerdekaan', daysAgo: 1 },
  { id: 'bangun-datar', title: 'Bangun datar', daysAgo: 4 },
  { id: 'hukum-newton', title: 'Hukum Newton', daysAgo: 20 },
]

const PERSAMAAN_LINEAR_ANSWER = [
  'Inti jawabannya: pindahkan konstanta ke ruas kanan, lalu bagi dengan koefisien $x$.',
  '',
  'Langkahnya:',
  '',
  '1. Kurangi kedua ruas dengan 3000: $2x + 3000 - 3000 = 11000 - 3000$.',
  '2. Sederhanakan: $2x = 8000$.',
  '3. Bagi kedua ruas dengan 2: $x = \\frac{8000}{2} = 4000$.',
  '',
  'Jadi harga satu buku adalah Rp4.000.',
  '',
  'Untuk memeriksa, substitusikan kembali: $2(4000) + 3000 = 11000$.',
].join('\n')

const MESSAGE_SEED: Record<string, SeedMessage[]> = {
  'persamaan-linear': [
    { role: 'user', content: 'Bagaimana cara menyelesaikan persamaan 2x + 3000 = 11000?' },
    { role: 'assistant', content: PERSAMAAN_LINEAR_ANSWER },
  ],
  'sel-tumbuhan': [
    { role: 'user', content: 'Apa beda sel hewan dan sel tumbuhan?' },
    {
      role: 'assistant',
      content:
        'Sel tumbuhan memiliki dinding sel dan kloroplas, sedangkan sel hewan tidak memilikinya. Keduanya sama-sama memiliki membran sel, sitoplasma, dan inti sel.',
    },
  ],
  'proklamasi-kemerdekaan': [
    { role: 'user', content: 'Kapan proklamasi kemerdekaan Indonesia dibacakan?' },
    {
      role: 'assistant',
      content:
        'Proklamasi kemerdekaan Indonesia dibacakan pada 17 Agustus 1945 di Jalan Pegangsaan Timur 56, Jakarta.',
    },
  ],
  'bangun-datar': [
    { role: 'user', content: 'Apa rumus luas persegi panjang?' },
    { role: 'assistant', content: 'Luas persegi panjang adalah $L = p \\times l$, dengan $p$ panjang dan $l$ lebar.' },
  ],
  'hukum-newton': [
    { role: 'user', content: 'Apa bunyi hukum Newton kedua?' },
    {
      role: 'assistant',
      content: 'Percepatan benda sebanding dengan gaya total yang bekerja padanya dan berbanding terbalik dengan massanya: $F = m a$.',
    },
  ],
}

const DAY_MS = 24 * 60 * 60 * 1000
const MINUTE_MS = 60 * 1000
const TITLE_MAX_LENGTH = 60

// Seed conversations stay listed until the user clears the history.
let seedVisible = true

// Conversations created during this page session, for example a chat opened from a topic on Learning.
let created: Conversation[] = []

// Conversations the user removed, and titles the user changed. Seed items are kept but hidden or renamed here.
const deletedIds = new Set<string>()
const renamedTitles = new Map<string, string>()

// Messages of every known conversation, keyed by conversation id.
const messageStore = new Map<string, ChatMessage[]>(
  Object.entries(MESSAGE_SEED).map(([conversationId, messages]) => [
    conversationId,
    messages.map((message, index) => ({
      id: `${conversationId}-${index}`,
      role: message.role,
      content: message.content,
      status: 'done' as const,
    })),
  ]),
)

export async function clearConversations(): Promise<void> {
  if (usesServer()) {
    await apiRequest('DELETE', '/api/conversations')
    return
  }
  seedVisible = false
  created = []
  messageStore.clear()
  deletedIds.clear()
  renamedTitles.clear()
}

export async function renameConversation(conversationId: string, title: string): Promise<void> {
  const trimmed = title.trim()
  if (trimmed === '') {
    throw new Error('Judul percakapan tidak boleh kosong.')
  }
  if (usesServer()) {
    await apiRequest('PATCH', `/api/conversations/${encodeId(conversationId)}`, { title: trimmed })
    return
  }
  renamedTitles.set(conversationId, trimmed)
}

export async function deleteConversation(conversationId: string): Promise<void> {
  if (usesServer()) {
    await apiRequest('DELETE', `/api/conversations/${encodeId(conversationId)}`)
    return
  }
  deletedIds.add(conversationId)
  messageStore.delete(conversationId)
  created = created.filter((item) => item.id !== conversationId)
}

export async function fetchConversations(now: Date = new Date()): Promise<Conversation[]> {
  if (usesServer()) {
    return listSchema.parse(await apiRequest('GET', '/api/conversations')).conversations
  }
  const seeded: Conversation[] = seedVisible
    ? SEED.map((item, index) => ({
        id: item.id,
        title: item.title,
        // Small offsets keep the order stable between items on the same day.
        updatedAt: new Date(now.getTime() - item.daysAgo * DAY_MS - index * MINUTE_MS).toISOString(),
      }))
    : []
  return [...seeded, ...created.map((item) => ({ ...item }))]
    .filter((item) => !deletedIds.has(item.id))
    .map((item) => ({ ...item, title: renamedTitles.get(item.id) ?? item.title }))
}

// Returns null when the conversation has no messages stored, so the page can show "not found".
// A streaming message left over from an earlier visit is shown as stopped.
export async function fetchConversationMessages(conversationId: string): Promise<ChatMessage[] | null> {
  if (usesServer()) {
    try {
      const detail = detailSchema.parse(await apiRequest('GET', `/api/conversations/${encodeId(conversationId)}`))
      return detail.conversation.messages.map(toChatMessage)
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        return null
      }
      throw error
    }
  }
  const stored = messageStore.get(conversationId)
  if (!stored) {
    return null
  }
  return structuredClone(stored).map((message) =>
    message.status === 'streaming' ? { ...message, status: 'stopped' } : message,
  )
}

// Saves the messages of a conversation. The first save creates it in the history list.
// Empty threads are not saved, so an unused topic does not appear in the history.
export async function saveConversationMessages(
  conversationId: string,
  messages: ChatMessage[],
  title?: string,
): Promise<void> {
  if (usesServer()) {
    // Empty threads are not saved, as before. The title is optional: the backend uses the first question.
    if (messages.length === 0) {
      return
    }
    await apiRequest('PUT', `/api/conversations/${encodeId(conversationId)}`, {
      messages: messages.map((message) => ({
        id: message.id,
        role: message.role,
        content: message.content,
        status: message.status,
      })),
      ...(title ? { title } : {}),
    })
    return
  }
  if (messages.length === 0 || deletedIds.has(conversationId)) {
    return
  }
  messageStore.set(conversationId, structuredClone(messages))

  const isSeeded = seedVisible && SEED.some((item) => item.id === conversationId)
  if (isSeeded) {
    return
  }

  const updatedAt = new Date().toISOString()
  const existing = created.find((item) => item.id === conversationId)
  if (existing) {
    existing.updatedAt = updatedAt
    return
  }

  const firstQuestion = messages.find((message) => message.role === 'user')?.content ?? 'Percakapan baru'
  created = [
    ...created,
    {
      id: conversationId,
      title: title ?? truncateTitle(firstQuestion),
      updatedAt,
    },
  ]
}

// Signed-in users read and write through the backend. Guests keep their conversations on this page session only.
function usesServer(): boolean {
  return useSessionStore.getState().mode === 'signedIn'
}

function encodeId(id: string): string {
  return encodeURIComponent(id)
}

const summarySchema = z.object({ id: z.string(), title: z.string(), updatedAt: z.string() })
const listSchema = z.object({ conversations: z.array(summarySchema) })
const detailSchema = z.object({
  conversation: summarySchema.extend({
    messages: z.array(
      z.object({
        id: z.string(),
        role: z.enum(['user', 'assistant']),
        content: z.string(),
        status: z.enum(['streaming', 'done', 'stopped']),
      }),
    ),
  }),
})

// A stream left over from an earlier visit cannot continue, so it is shown as stopped.
function toChatMessage(message: z.infer<typeof detailSchema>['conversation']['messages'][number]): ChatMessage {
  const status: MessageStatus = message.status === 'streaming' ? 'stopped' : message.status
  return { id: message.id, role: message.role, content: message.content, status }
}

function truncateTitle(text: string): string {
  return text.length > TITLE_MAX_LENGTH ? `${text.slice(0, TITLE_MAX_LENGTH - 1)}…` : text
}
