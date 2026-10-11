import request from 'supertest'
import { beforeEach, describe, expect, it } from 'vitest'
import { prisma } from '../src/db.js'
import { createTestApp, registerAgent, resetDatabase } from './helpers.js'

const app = createTestApp()
const GUEST = '11111111-2222-4333-8444-555555555555'

const chat = (id: string, title: string, status: 'done' | 'streaming' = 'done') => ({
  id,
  title,
  messages: [
    { id: `${id}-1`, role: 'user', content: `Tanya tentang ${title}`, status: 'done' },
    { id: `${id}-2`, role: 'assistant', content: `Jawaban ${title}`, status },
  ],
})

describe('impor riwayat tamu', () => {
  beforeEach(resetDatabase)

  it('dua percakapan tamu masuk ke akun, dan jawaban yang masih berjalan dihentikan', async () => {
    const agent = await registerAgent(app)
    const response = await agent.post('/api/conversations/import').send({ percakapan: [chat('a', 'Sel'), chat('b', 'Gaya', 'streaming')] })
    expect(response.status).toBe(201)
    expect(response.body).toEqual({ diimpor: 2, dilewati: 0 })

    const detail = await agent.get('/api/conversations/b')
    expect(detail.body.conversation.title).toBe('Gaya')
    expect(detail.body.conversation.messages[1].status).toBe('stopped')
    expect((await agent.get('/api/conversations')).body.conversations).toHaveLength(2)
  })

  it('impor dua kali tidak menggandakan percakapan', async () => {
    const agent = await registerAgent(app)
    await agent.post('/api/conversations/import').send({ percakapan: [chat('a', 'Sel')] }).expect(201)
    const again = await agent.post('/api/conversations/import').send({ percakapan: [chat('a', 'Sel')] })
    expect(again.body).toEqual({ diimpor: 0, dilewati: 1 })
    expect((await agent.get('/api/conversations')).body.conversations).toHaveLength(1)
    expect(await prisma.message.count()).toBe(2)
  })

  it('lebih dari dua percakapan ditolak', async () => {
    const agent = await registerAgent(app)
    const response = await agent.post('/api/conversations/import').send({ percakapan: [chat('a', 'A'), chat('b', 'B'), chat('c', 'C')] })
    expect(response.status).toBe(400)
  })

  it('tamu tidak bisa mengimpor ke akun', async () => {
    const response = await request(app).post('/api/conversations/import').set('X-Guest-Id', GUEST).send({ percakapan: [chat('a', 'A')] })
    expect(response.status).toBe(403)
    expect(response.body.kode).toBe('HANYA_MASUK')
  })
})
