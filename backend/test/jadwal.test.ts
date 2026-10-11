import { beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'
import { prisma } from '../src/db.js'
import { refreshSuggestions } from '../src/jadwal/suggestions.js'
import { createTestApp, registerWithExampleGraph, resetDatabase } from './helpers.js'

const app = createTestApp()

describe('jadwal', () => {
  beforeEach(resetDatabase)

  it('saran dari skor dan tautan bulat muncul di minggu ini', async () => {
    const agent = await registerWithExampleGraph(app)
    const response = await agent.get('/api/jadwal')
    expect(response.status).toBe(200)
    const suggestions = response.body.items.filter((item: { kind: string }) => item.kind === 'SARAN')
    const titles = suggestions.map((item: { title: string }) => item.title).sort()
    expect(titles).toEqual(['Grafik fungsi', 'Latihan Persamaan linear', 'Pertidaksamaan', 'Ulangi Sel tumbuhan'])
    const review = suggestions.find((item: { title: string }) => item.title === 'Ulangi Sel tumbuhan')
    expect(review.reason).toBe('Karena skor 38 pada Sel tumbuhan')
  })

  it('saran diterima menjadi item latihan biasa', async () => {
    const agent = await registerWithExampleGraph(app)
    const list = await agent.get('/api/jadwal')
    const suggestion = list.body.items.find((item: { title: string }) => item.title === 'Pertidaksamaan')

    const accepted = await agent.patch(`/api/jadwal/item/${suggestion.id}`).send({ accept: true })
    expect(accepted.status).toBe(200)
    expect(accepted.body.item.kind).toBe('LATIHAN')
  })

  it('saran yang dipindah ke hari lain juga diterima', async () => {
    const agent = await registerWithExampleGraph(app)
    const list = await agent.get('/api/jadwal')
    const suggestion = list.body.items.find((item: { title: string }) => item.title === 'Grafik fungsi')
    const moved = await agent.patch(`/api/jadwal/item/${suggestion.id}`).send({ date: '2026-10-31' })
    expect(moved.body.item.date).toBe('2026-10-31')
    expect(moved.body.item.kind).toBe('LATIHAN')
  })

  it('saran dibuat sekali sehari', async () => {
    const agent = await registerWithExampleGraph(app)
    await agent.get('/api/jadwal')
    await agent.get('/api/jadwal')
    const user = await agent.get('/api/auth/me')
    expect(await prisma.scheduleRun.count({ where: { userId: user.body.user.id } })).toBe(1)
  })

  it('AI tidak dipanggil lagi kalau ingatan tidak berubah, dan dipanggil saat skor berubah', async () => {
    const agent = await registerWithExampleGraph(app)
    const user = await agent.get('/api/auth/me')
    const userId = user.body.user.id
    await agent.get('/api/jadwal')
    await prisma.scheduleItem.deleteMany({ where: { userId, kind: 'SARAN' } })

    // Next day, same scores: the job runs but skips the AI, so no suggestion comes back.
    await refreshSuggestions(userId, new Date(2099, 0, 5))
    expect(await prisma.scheduleItem.count({ where: { userId, kind: 'SARAN' } })).toBe(0)

    // A changed score makes the memory different, so the suggestions are made again.
    await prisma.topic.update({ where: { userId_id: { userId, id: 'sel-tumbuhan' } }, data: { lastScore: 20 } })
    await refreshSuggestions(userId, new Date(2099, 0, 6))
    const titles = await prisma.scheduleItem.findMany({ where: { userId, kind: 'SARAN' } })
    expect(titles.map((item) => item.reason)).toContain('Karena skor 20 pada Sel tumbuhan')
  })

  it('tamu tidak bisa membaca atau mengubah jadwal', async () => {
    const response = await request(app).get('/api/jadwal')
    expect(response.status).toBe(401)
    const change = await request(app).post('/api/jadwal/item').send({ date: '2026-10-01', title: 'Latihan' })
    expect(change.status).toBe(401)
  })

  it('item baru dan tanggal yang salah ditangani', async () => {
    const agent = await registerWithExampleGraph(app)
    const created = await agent.post('/api/jadwal/item').send({ date: '2026-10-12', title: 'Latihan bebas' })
    expect(created.status).toBe(201)
    expect(created.body.item.kind).toBe('LATIHAN')

    const badDate = await agent.post('/api/jadwal/item').send({ date: '12-10-2026', title: 'Salah' })
    expect(badDate.status).toBe(400)
    expect(badDate.body.rincian[0].path).toBe('date')
  })

  it('memori hanya berisi topik yang punya skor, dengan status sesuai ambang', async () => {
    const agent = await registerWithExampleGraph(app)
    const response = await agent.get('/api/memori')
    const byName = Object.fromEntries(response.body.entries.map((entry: { topicName: string; status: string }) => [entry.topicName, entry.status]))
    expect(byName['Bilangan']).toBe('DIKUASAI')
    expect(byName['Persamaan linear']).toBe('SEDANG')
    expect(byName['Sel tumbuhan']).toBe('PERLU_DIULANG')
    expect(byName['Fungsi kuadrat']).toBeUndefined()
  })
})
