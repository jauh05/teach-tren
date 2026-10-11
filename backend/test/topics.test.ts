import { beforeEach, describe, expect, it } from 'vitest'
import { createTestApp, registerAgent, resetDatabase } from './helpers.js'

const app = createTestApp()

describe('bulat', () => {
  beforeEach(resetDatabase)

  it('nama bulat yang sama walau beda huruf besar ditolak', async () => {
    const agent = await registerAgent(app)
    await agent.post('/api/topics').send({ name: 'Geometri' }).expect(201)
    const response = await agent.post('/api/topics').send({ name: '  geometri ' })
    expect(response.status).toBe(409)
    expect(response.body.pesan).toBe('Nama bulat sudah dipakai.')
  })

  it('ganti nama ke nama bulat sendiri tetap boleh', async () => {
    const agent = await registerAgent(app)
    const created = await agent.post('/api/topics').send({ name: 'Geometri' })
    await agent.patch(`/api/topics/${created.body.topic.id}`).send({ name: 'geometri' }).expect(200)
  })

  it('bulat orang lain tidak bisa diganti namanya', async () => {
    const owner = await registerAgent(app, 'pemilik@contoh.id')
    const created = await owner.post('/api/topics').send({ name: 'Rahasia' })
    const other = await registerAgent(app, 'lain@contoh.id')
    const response = await other.patch(`/api/topics/${created.body.topic.id}`).send({ name: 'Curian' })
    expect(response.status).toBe(404)
  })

  it('skor di luar 0 sampai 100 ditolak', async () => {
    const agent = await registerAgent(app)
    const low = await agent.post('/api/topics/bilangan/scores').send({ percent: -1 })
    const high = await agent.post('/api/topics/bilangan/scores').send({ percent: 101 })
    expect(low.status).toBe(400)
    expect(high.status).toBe(400)
  })

  it('skor tersimpan sebagai skor terbaru bulat', async () => {
    const agent = await registerAgent(app)
    await agent.post('/api/topics/fungsi-kuadrat/scores').send({ percent: 60 }).expect(201)
    const response = await agent.post('/api/topics/fungsi-kuadrat/scores').send({ percent: 80 })
    expect(response.body.lastScore).toBe(80)

    const topics = await agent.get('/api/topics')
    const topic = topics.body.topics.find((item: { id: string }) => item.id === 'fungsi-kuadrat')
    expect(topic.lastScore).toBe(80)
  })

  it('skor untuk bulat yang tidak ada ditolak', async () => {
    const agent = await registerAgent(app)
    const response = await agent.post('/api/topics/tidak-ada/scores').send({ percent: 50 })
    expect(response.status).toBe(404)
    expect(response.body.pesan).toBe('Bulat tidak ditemukan.')
  })
})
