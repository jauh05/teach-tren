import type { ChatMessage, Conversation } from '../domain/types'

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

// Set by clearConversations. Stays for the rest of the page session.
let historyCleared = false

export async function clearConversations(): Promise<void> {
  historyCleared = true
}

export async function fetchConversations(now: Date = new Date()): Promise<Conversation[]> {
  if (historyCleared) {
    return []
  }
  return SEED.map((item, index) => ({
    id: item.id,
    title: item.title,
    // Small offsets keep the order stable between items on the same day.
    updatedAt: new Date(now.getTime() - item.daysAgo * DAY_MS - index * MINUTE_MS).toISOString(),
  }))
}

// Returns null when the conversation does not exist, so the page can show "not found".
export async function fetchConversationMessages(conversationId: string): Promise<ChatMessage[] | null> {
  if (!Object.hasOwn(MESSAGE_SEED, conversationId)) {
    return null
  }
  return MESSAGE_SEED[conversationId].map((message, index) => ({
    id: `${conversationId}-${index}`,
    role: message.role,
    content: message.content,
    status: 'done',
  }))
}
