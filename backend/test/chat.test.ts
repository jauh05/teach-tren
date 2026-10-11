import request from 'supertest'
import { beforeEach, describe, expect, it } from 'vitest'
import { prisma } from '../src/db.js'
import { SlidingWindowLimiter } from '../src/chat/rateLimit.js'
import { createTestApp, registerAgent, resetDatabase } from './helpers.js'

const app = createTestApp()
const GUEST = '11111111-2222-4333-8444-555555555555'
const OTHER_GUEST = '66666666-7777-4888-8999-000000000000'

interface SseEvent {
  event: string
  data: Record<string, unknown>
}

// Splits a server-sent events body into events.
function parseEvents(body: string): SseEvent[] {
  return body
    .split('\n\n')
    .filter((block) => block.trim() !== '')
    .map((block) => {
      const lines = block.split('\n')
      const event = lines.find((line) => line.startsWith('event: '))?.slice('event: '.length) ?? ''
      const data = lines.find((line) => line.startsWith('data: '))?.slice('data: '.length) ?? '{}'
      return { event, data: JSON.parse(data) as Record<string, unknown> }
    })
}

async function ask(target: { post(url: string): request.Test }, path: string, body: object, guestId?: string) {
  const req = target.post(path)
  if (guestId) {
    req.set('X-Guest-Id', guestId)
  }
  return req.send(body)
}

describe('jawaban chat', () => {
  beforeEach(resetDatabase)

  it('pengguna masuk mendapat jawaban bertahap dan pesan tersimpan', async () => {
    const agent = await registerAgent(app)
    const response = await agent.post('/api/conversations/sel/messages').send({ content: 'Apa itu sel?' })
    expect(response.status).toBe(200)
    expect(response.headers['content-type']).toContain('text/event-stream')

    const events = parseEvents(response.text)
    expect(events[0].event).toBe('meta')
    expect(events.filter((event) => event.event === 'delta').length).toBeGreaterThan(1)
    expect(events.at(-1)?.event).toBe('done')

    const conversation = await agent.get('/api/conversations/sel')
    expect(conversation.body.conversation.title).toBe('Apa itu sel?')
    const [question, answer] = conversation.body.conversation.messages
    expect(question.content).toBe('Apa itu sel?')
    expect(answer.status).toBe('done')
    expect(answer.content).toContain('Ini jawaban contoh dari tampilan frontend.')
  })

  it('tamu bisa bertanya dua kali lalu kuota habis dengan kode KUOTA_HABIS', async () => {
    const first = await ask(request(app), '/api/conversations/tamu/messages', { content: 'Pertanyaan pertama' }, GUEST)
    expect(first.status).toBe(200)
    const second = await ask(request(app), '/api/conversations/tamu/messages', { content: 'Pertanyaan kedua' }, GUEST)
    expect(second.status).toBe(200)

    const third = await ask(request(app), '/api/conversations/tamu/messages', { content: 'Pertanyaan ketiga' }, GUEST)
    expect(third.status).toBe(429)
    expect(third.body).toEqual({ pesan: 'Aksi AI gratis sudah habis. Daftar atau masuk untuk lanjut.', kode: 'KUOTA_HABIS' })
  })

  it('kuota tamu dihitung per perangkat, bukan per percakapan', async () => {
    await ask(request(app), '/api/conversations/a/messages', { content: 'satu' }, GUEST)
    await ask(request(app), '/api/conversations/b/messages', { content: 'dua' }, GUEST)
    const blocked = await ask(request(app), '/api/conversations/c/messages', { content: 'tiga' }, GUEST)
    expect(blocked.status).toBe(429)

    const otherDevice = await ask(request(app), '/api/conversations/c/messages', { content: 'tiga' }, OTHER_GUEST)
    expect(otherDevice.status).toBe(200)
  })

  it('tamu tidak menyimpan percakapan di server', async () => {
    await ask(request(app), '/api/conversations/tamu/messages', { content: 'halo' }, GUEST)
    expect(await prisma.conversation.count()).toBe(0)
    expect(await prisma.message.count()).toBe(0)
  })

  it('tanpa sesi dan tanpa X-Guest-Id yang valid, permintaan ditolak', async () => {
    const response = await request(app).post('/api/conversations/x/messages').send({ content: 'halo' })
    expect(response.status).toBe(401)
    const badId = await ask(request(app), '/api/conversations/x/messages', { content: 'halo' }, 'bukan-uuid')
    expect(badId.status).toBe(401)
  })

  it('pesan kosong dan pesan lebih dari 3000 karakter ditolak', async () => {
    const agent = await registerAgent(app)
    const empty = await agent.post('/api/conversations/x/messages').send({ content: '   ' })
    expect(empty.status).toBe(400)
    const long = await agent.post('/api/conversations/x/messages').send({ content: 'a'.repeat(3001) })
    expect(long.status).toBe(400)
    expect(long.body.rincian[0].pesan).toBe('Pesan maksimal 3000 karakter.')
  })

  it('kuota harian pengguna masuk membatasi 200 pesan per hari', async () => {
    const agent = await registerAgent(app)
    const user = await agent.get('/api/auth/me')
    await prisma.conversation.create({ data: { userId: user.body.user.id, id: 'sudah-ada', title: 'Lama' } })
    await prisma.message.createMany({
      data: Array.from({ length: 200 }, (_, index) => ({
        id: `harian-${index}`,
        userId: user.body.user.id,
        conversationId: 'sudah-ada',
        role: 'user' as const,
        content: `pesan ${index}`,
        status: 'done' as const,
        position: index,
      })),
    })
    const response = await agent.post('/api/conversations/baru/messages').send({ content: 'lagi' })
    expect(response.status).toBe(429)
    expect(response.body.kode).toBe('KUOTA_HABIS')
  })

  it('percakapan dengan id yang sama dari akun lain tidak mengubah milik orang itu', async () => {
    const owner = await registerAgent(app, 'pemilik@contoh.id')
    await owner.post('/api/conversations/sama/messages').send({ content: 'pertanyaan pemilik' })
    const other = await registerAgent(app, 'lain@contoh.id')
    await other.post('/api/conversations/sama/messages').send({ content: 'pertanyaan lain' })

    const ownerView = await owner.get('/api/conversations/sama')
    expect(ownerView.body.conversation.messages.map((message: { content: string }) => message.content)).not.toContain(
      'pertanyaan lain',
    )
    const otherView = await other.get('/api/conversations/sama')
    expect(otherView.body.conversation.messages[0].content).toBe('pertanyaan lain')
  })
})

describe('pembatas kecepatan', () => {
  it('menolak hit setelah batas per menit, lalu menerima lagi setelah jendela lewat', () => {
    const limiter = new SlidingWindowLimiter(2, 60_000)
    expect(limiter.take('ip', 0)).toBe(true)
    expect(limiter.take('ip', 1)).toBe(true)
    expect(limiter.take('ip', 2)).toBe(false)
    expect(limiter.take('ip', 60_001)).toBe(true)
  })
})
