import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createTestApp, registerAgent, registerWithExampleGraph, resetDatabase } from './helpers.js'

const app = createTestApp()

describe('neuron', () => {
  beforeEach(resetDatabase)

  it('nama neuron yang sama walau beda huruf besar ditolak', async () => {
    const agent = await registerAgent(app)
    await agent.post('/api/topics').send({ name: 'Geometri' }).expect(201)
    const response = await agent.post('/api/topics').send({ name: '  geometri ' })
    expect(response.status).toBe(409)
    expect(response.body.pesan).toBe('Nama neuron sudah dipakai.')
  })

  it('ganti nama ke nama neuron sendiri tetap boleh', async () => {
    const agent = await registerAgent(app)
    const created = await agent.post('/api/topics').send({ name: 'Geometri' })
    await agent.patch(`/api/topics/${created.body.topic.id}`).send({ name: 'geometri' }).expect(200)
  })

  it('neuron orang lain tidak bisa diganti namanya', async () => {
    const owner = await registerAgent(app, 'pemilik@contoh.id')
    const created = await owner.post('/api/topics').send({ name: 'Rahasia' })
    const other = await registerAgent(app, 'lain@contoh.id')
    const response = await other.patch(`/api/topics/${created.body.topic.id}`).send({ name: 'Curian' })
    expect(response.status).toBe(404)
  })

  it('skor di luar 0 sampai 100 ditolak', async () => {
    const agent = await registerWithExampleGraph(app)
    const low = await agent.post('/api/topics/bilangan/scores').send({ percent: -1 })
    const high = await agent.post('/api/topics/bilangan/scores').send({ percent: 101 })
    expect(low.status).toBe(400)
    expect(high.status).toBe(400)
  })

  it('skor tersimpan sebagai skor terbaru neuron', async () => {
    const agent = await registerWithExampleGraph(app)
    await agent.post('/api/topics/fungsi-kuadrat/scores').send({ percent: 60 }).expect(201)
    const response = await agent.post('/api/topics/fungsi-kuadrat/scores').send({ percent: 80 })
    expect(response.body.lastScore).toBe(80)

    const topics = await agent.get('/api/topics')
    const topic = topics.body.topics.find((item: { id: string }) => item.id === 'fungsi-kuadrat')
    expect(topic.lastScore).toBe(80)
  })

  it('skor untuk neuron yang tidak ada ditolak', async () => {
    const agent = await registerAgent(app)
    const response = await agent.post('/api/topics/tidak-ada/scores').send({ percent: 50 })
    expect(response.status).toBe(404)
    expect(response.body.pesan).toBe('Neuron tidak ditemukan.')
  })
})

describe('pola berikutnya', () => {
  beforeEach(resetDatabase)

  it('neuron yang dibuat dari neuron lain terhubung dari neuron asal', async () => {
    const agent = await registerWithExampleGraph(app)
    const created = await agent.post('/api/topics').send({ name: 'Pecahan campuran', dariId: 'bilangan' }).expect(201)

    const graph = (await agent.get('/api/topics').expect(200)).body
    expect(graph.links).toContainEqual({ source: 'bilangan', target: created.body.topic.id, suggested: false })
  })

  it('neuron yang dibuat dari neuron lain mengambil mapel neuron asal', async () => {
    const agent = await registerWithExampleGraph(app)
    const before = (await agent.get('/api/topics').expect(200)).body
    const source = before.topics.find((topic: { id: string }) => topic.id === 'bilangan')
    const created = await agent.post('/api/topics').send({ name: 'Pecahan campuran', dariId: 'bilangan' }).expect(201)

    const after = (await agent.get('/api/topics').expect(200)).body
    const topic = after.topics.find((item: { id: string }) => item.id === created.body.topic.id)
    expect(topic.subject).toBe(source.subject)
  })

  it('neuron tanpa neuron asal masuk ke mapel Umum', async () => {
    const agent = await registerAgent(app)
    await agent.post('/api/topics').send({ name: 'Catatan bebas' }).expect(201)

    const graph = (await agent.get('/api/topics').expect(200)).body
    expect(graph.topics[0].subject).toBe('Umum')
  })

  it('neuron asal yang tidak dimiliki akun ditolak', async () => {
    const agent = await registerWithExampleGraph(app)
    const response = await agent.post('/api/topics').send({ name: 'Pecahan campuran', dariId: 'tidak-ada' })
    expect(response.status).toBe(404)
  })

  it('tautan antar neuron dibuat sekali, dan tautan ke diri sendiri atau ke neuron asing ditolak', async () => {
    const agent = await registerWithExampleGraph(app)
    await agent.post('/api/topics/tautan').send({ dariId: 'sel-tumbuhan', keId: 'bilangan' }).expect(201)

    expect((await agent.post('/api/topics/tautan').send({ dariId: 'sel-tumbuhan', keId: 'bilangan' })).status).toBe(409)
    expect((await agent.post('/api/topics/tautan').send({ dariId: 'bilangan', keId: 'bilangan' })).status).toBe(400)
    expect((await agent.post('/api/topics/tautan').send({ dariId: 'bilangan', keId: 'tidak-ada' })).status).toBe(404)

    const other = await registerAgent(app, 'lain@contoh.id')
    const foreign = await other.post('/api/topics').send({ name: 'Rahasia' })
    expect((await agent.post('/api/topics/tautan').send({ dariId: 'bilangan', keId: foreign.body.topic.id })).status).toBe(404)
  })

  it('saran pola dari AI memakai nama yang belum ada, dan neuron yang tidak dimiliki akun ditolak', async () => {
    const agent = await registerWithExampleGraph(app)
    const response = await agent.post('/api/topics/saran').send({ polaId: 'persamaan-linear' })
    expect(response.status).toBe(200)
    expect(response.body.saran).toHaveLength(3)
    expect(response.body.saran[0].nama).toBe('Penerapan Persamaan linear')

    expect((await agent.post('/api/topics/saran').send({ polaId: 'tidak-ada' })).status).toBe(404)
  })

  it('saran yang namanya sudah dipakai neuron lain tidak diulang', async () => {
    const agent = await registerWithExampleGraph(app)
    await agent.post('/api/topics').send({ name: 'Latihan Persamaan linear' }).expect(201)
    const response = await agent.post('/api/topics/saran').send({ polaId: 'persamaan-linear' }).expect(200)
    expect(response.body.saran.map((item: { nama: string }) => item.nama)).not.toContain('Latihan Persamaan linear')
  })
})

describe('batas saran pola', () => {
  beforeEach(resetDatabase)

  it('permintaan saran di atas batas per jam ditolak dengan 429', async () => {
    vi.resetModules()
    vi.stubEnv('POLA_SARAN_PER_HOUR', '2')
    try {
      const { createApp } = await import('../src/app.js')
      const limited = createApp({ corsOrigin: 'http://localhost:5173' })
      const agent = await registerWithExampleGraph(limited)
      await agent.post('/api/topics/saran').send({ polaId: 'bilangan' }).expect(200)
      await agent.post('/api/topics/saran').send({ polaId: 'bilangan' }).expect(200)
      const blocked = await agent.post('/api/topics/saran').send({ polaId: 'bilangan' })
      expect(blocked.status).toBe(429)
      expect(blocked.body.kode).toBe('TERLALU_CEPAT')
    } finally {
      vi.unstubAllEnvs()
    }
  })
})
