import request from 'supertest'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { prisma } from '../src/db.js'
import { createTestApp, registerAgent, registerWithExampleGraph, resetDatabase } from './helpers.js'

const app = createTestApp()
const GUEST = '2f3c9a52-7d1e-4b8a-9c3f-0a1b2c3d4e5f'

describe('saran pola untuk tamu', () => {
  beforeEach(resetDatabase)

  it('tamu bisa generate sekali tanpa masuk, lalu diminta masuk', async () => {
    const first = await request(app).post('/api/topics/saran').set('X-Guest-Id', GUEST).send({ tujuan: 'Pecahan' })
    expect(first.status).toBe(200)
    expect(first.body.saran).toHaveLength(3)

    const blocked = await request(app).post('/api/topics/saran').set('X-Guest-Id', GUEST).send({ tujuan: 'Geometri' })
    expect(blocked.status).toBe(429)
    expect(blocked.body.kode).toBe('KUOTA_HABIS')
  })

  it('generate tamu tidak memakai kuota chat, dan kuota chat tidak memakai generate', async () => {
    await request(app).post('/api/topics/saran').set('X-Guest-Id', GUEST).send({ tujuan: 'Pecahan' }).expect(200)
    const usage = await prisma.guestUsage.findUnique({ where: { guestId: GUEST } })
    expect(usage).toMatchObject({ generated: 1, actions: 0 })
  })

  it('tamu tidak bisa memakai pola id karena pola tamu belum ada di server', async () => {
    const response = await request(app).post('/api/topics/saran').set('X-Guest-Id', GUEST).send({ polaId: 'bilangan' })
    expect(response.status).toBe(400)
  })

  it('permintaan tanpa identitas ditolak', async () => {
    const response = await request(app).post('/api/topics/saran').send({ tujuan: 'Pecahan' })
    expect(response.status).toBe(401)
  })

  it('saran dengan nama pola yang sudah ada di perangkat tidak diulang', async () => {
    const response = await request(app).post('/api/topics/saran').set('X-Guest-Id', GUEST).send({ nama: 'Pecahan', sudahAda: ['Penerapan Pecahan'] })
    expect(response.status).toBe(200)
    expect(response.body.saran.map((item: { nama: string }) => item.nama)).not.toContain('Penerapan Pecahan')
  })
})

describe('materi per bagian untuk neuron', () => {
  beforeEach(resetDatabase)

  it('setiap klik membuat satu bagian berurutan, dan daftar menampilkannya', async () => {
    const agent = await registerWithExampleGraph(app)
    const first = await agent.post('/api/topics/persamaan-linear/materi-ai').expect(201)
    expect(first.body.materi).toMatchObject({ position: 1, judul: 'Bagian 1: Persamaan linear' })

    const second = await agent.post('/api/topics/persamaan-linear/materi-ai').expect(201)
    expect(second.body.materi.position).toBe(2)

    const list = await agent.get('/api/topics/persamaan-linear/materi-ai').expect(200)
    expect(list.body.materi.map((part: { position: number }) => part.position)).toEqual([1, 2])
  })

  it('bagian materi dibatasi dua puluh per neuron', async () => {
    const agent = await registerWithExampleGraph(app)
    for (let index = 0; index < 20; index++) {
      await agent.post('/api/topics/bilangan/materi-ai').expect(201)
    }
    const blocked = await agent.post('/api/topics/bilangan/materi-ai')
    expect(blocked.status).toBe(409)
  })

  it('materi milik akun lain tidak bisa dibuat atau dibaca', async () => {
    const owner = await registerWithExampleGraph(app, 'pemilik@contoh.id')
    await owner.post('/api/topics/bilangan/materi-ai').expect(201)
    const other = await registerAgent(app, 'lain@contoh.id')

    expect((await other.post('/api/topics/bilangan/materi-ai')).status).toBe(404)
    expect((await other.get('/api/topics/bilangan/materi-ai')).status).toBe(404)
  })

  it('tamu tidak bisa membuat materi karena bulatnya belum tersimpan di akun', async () => {
    const response = await request(app).post('/api/topics/bilangan/materi-ai').set('X-Guest-Id', GUEST)
    expect(response.status).toBe(403)
  })

  it('batas per jam untuk materi ditolak dengan 429', async () => {
    vi.resetModules()
    vi.stubEnv('MATERI_BULAT_PER_HOUR', '2')
    try {
      const { createApp } = await import('../src/app.js')
      const limited = createApp({ corsOrigin: 'http://localhost:5173' })
      const agent = await registerWithExampleGraph(limited)
      await agent.post('/api/topics/bilangan/materi-ai').expect(201)
      await agent.post('/api/topics/bilangan/materi-ai').expect(201)
      const blocked = await agent.post('/api/topics/bilangan/materi-ai')
      expect(blocked.status).toBe(429)
      expect(blocked.body.kode).toBe('TERLALU_CEPAT')
    } finally {
      vi.unstubAllEnvs()
    }
  })
})
