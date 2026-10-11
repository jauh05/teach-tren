import { beforeEach, describe, expect, it } from 'vitest'
import { createTestApp, registerAgent, resetDatabase } from './helpers.js'

const app = createTestApp()

describe('jadwal: rentang dan jenis sudah dikuasai', () => {
  beforeEach(resetDatabase)

  it('rentang tanggal hanya memuat item di dalam rentang, dengan ujungnya ikut', async () => {
    const agent = await registerAgent(app)
    await agent.post('/api/jadwal/item').send({ date: '2026-10-01', title: 'Awal rentang' }).expect(201)
    await agent.post('/api/jadwal/item').send({ date: '2026-10-07', title: 'Akhir rentang' }).expect(201)
    await agent.post('/api/jadwal/item').send({ date: '2026-10-08', title: 'Di luar rentang' }).expect(201)

    const response = await agent.get('/api/jadwal?mulai=2026-10-01&selesai=2026-10-07').expect(200)
    const titles = response.body.items.map((item: { title: string }) => item.title)
    expect(titles).toContain('Awal rentang')
    expect(titles).toContain('Akhir rentang')
    expect(titles).not.toContain('Di luar rentang')
  })

  it('rentang yang mulainya setelah selesainya ditolak dengan 400', async () => {
    const agent = await registerAgent(app)
    const response = await agent.get('/api/jadwal?mulai=2026-10-07&selesai=2026-10-01')
    expect(response.status).toBe(400)
    expect(response.body.rincian[0].pesan).toBe('Tanggal mulai harus sebelum atau sama dengan tanggal selesai.')
  })

  it('tanggal rentang yang bentuknya salah ditolak dengan 400', async () => {
    const agent = await registerAgent(app)
    const response = await agent.get('/api/jadwal?mulai=01-10-2026')
    expect(response.status).toBe(400)
  })

  it('item sudah dikuasai bisa dibuat dan dikembalikan dengan jenis DIKUASAI', async () => {
    const agent = await registerAgent(app)
    const created = await agent
      .post('/api/jadwal/item')
      .send({ date: '2026-10-05', title: 'Bilangan', kind: 'DIKUASAI', reason: 'Skor 90' })
      .expect(201)
    expect(created.body.item.kind).toBe('DIKUASAI')
  })

  it('saran AI tidak bisa dibuat langsung oleh pengguna', async () => {
    const agent = await registerAgent(app)
    const response = await agent.post('/api/jadwal/item').send({ date: '2026-10-05', title: 'Palsu', kind: 'SARAN' })
    expect(response.status).toBe(400)
  })
})
