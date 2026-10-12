import { beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'
import { prisma } from '../src/db.js'
import { createTestApp, registerAgent, resetDatabase } from './helpers.js'

const app = createTestApp()

// Validation errors carry one message per field in "rincian". The top-level "pesan" is the same for all of them.
function messagesOf(body: { rincian?: { pesan: string }[] }): string[] {
  return (body.rincian ?? []).map((issue) => issue.pesan)
}

const PLAN = {
  levelId: 'sd',
  grade: 4,
  subjects: ['Matematika', 'IPA'],
  topics: [
    { subject: 'Matematika', name: 'Pecahan sederhana' },
    { subject: 'Matematika', name: 'Bangun datar' },
    { subject: 'IPA', name: 'Tubuh manusia' },
  ],
}

describe('kurikulum', () => {
  it('daftar jenjang bisa dibuka tanpa masuk', async () => {
    const response = await request(app).get('/api/kurikulum').expect(200)
    const levels = response.body.jenjang.map((level: { id: string }) => level.id)
    expect(levels).toEqual(['sd', 'smp', 'sma', 'kuliah'])
  })
})

describe('rencana belajar', () => {
  beforeEach(resetDatabase)

  it('tamu tidak bisa melihat atau membuat rencana', async () => {
    const guestId = crypto.randomUUID()
    const read = await request(app).get('/api/rencana').set('X-Guest-Id', guestId)
    expect(read.status).toBe(403)
    expect(read.body.kode).toBe('HANYA_MASUK')

    const write = await request(app).post('/api/rencana').set('X-Guest-Id', guestId).send(PLAN)
    expect(write.status).toBe(403)
  })

  it('akun baru belum punya rencana', async () => {
    const agent = await registerAgent(app)
    const response = await agent.get('/api/rencana').expect(200)
    expect(response.body.rencana).toBeNull()
  })

  it('rencana membuat satu bulat per materi, dengan satu jalur per mata pelajaran', async () => {
    const agent = await registerAgent(app)
    const saved = await agent.post('/api/rencana').send(PLAN)
    expect(saved.status).toBe(201)
    expect(saved.body.bulat).toBe(3)
    expect(saved.body.rencana.subjects).toEqual(['Matematika', 'IPA'])

    const user = await prisma.user.findUniqueOrThrow({ where: { email: 'siswa@contoh.id' } })
    const topics = await prisma.topic.findMany({ where: { userId: user.id }, orderBy: { x: 'asc' } })
    const matematika = topics.filter((topic) => topic.subject === 'Matematika')
    const ipa = topics.filter((topic) => topic.subject === 'IPA')
    expect(matematika.map((topic) => topic.name)).toEqual(['Pecahan sederhana', 'Bangun datar'])
    expect(matematika[0].y).toBe(matematika[1].y)
    expect(ipa[0].y).toBeGreaterThan(matematika[0].y)

    // Each topic links to the next one of its lane, and lanes are not linked to each other.
    const links = await prisma.topicLink.findMany({ where: { userId: user.id } })
    expect(links).toEqual([expect.objectContaining({ sourceId: matematika[0].id, targetId: matematika[1].id })])
  })

  it('rencana yang sudah dibuat tidak bisa dibuat ulang', async () => {
    const agent = await registerAgent(app)
    await agent.post('/api/rencana').send(PLAN).expect(201)
    const again = await agent.post('/api/rencana').send(PLAN)
    expect(again.status).toBe(409)
    expect(again.body.kode).toBe('SUDAH_ADA')
    const read = await agent.get('/api/rencana').expect(200)
    expect(read.body.rencana.grade).toBe(4)
  })

  it('materi boleh dilewati, dan rencana tetap tersimpan', async () => {
    const agent = await registerAgent(app)
    const saved = await agent.post('/api/rencana').send({ ...PLAN, topics: [] })
    expect(saved.status).toBe(201)
    expect(saved.body.bulat).toBe(0)
  })

  it('materi yang namanya sudah dipakai bulat lain dilewati', async () => {
    const agent = await registerAgent(app)
    await agent.post('/api/topics').send({ name: 'pecahan sederhana' }).expect(201)
    const saved = await agent.post('/api/rencana').send(PLAN)
    expect(saved.status).toBe(201)
    expect(saved.body.bulat).toBe(2)
  })

  it('roadmap diletakkan di bawah bulat yang sudah ada', async () => {
    const agent = await registerAgent(app)
    await agent.post('/api/topics').send({ name: 'Bulat lama' }).expect(201)
    const user = await prisma.user.findUniqueOrThrow({ where: { email: 'siswa@contoh.id' } })
    const existing = await prisma.topic.findMany({ where: { userId: user.id } })
    const existingIds = new Set(existing.map((topic) => topic.id))
    const lowestRoadmapY = Math.max(...existing.map((topic) => topic.y))

    await agent.post('/api/rencana').send(PLAN).expect(201)
    const created = await prisma.topic.findMany({ where: { userId: user.id } })
    const roadmap = created.filter((topic) => !existingIds.has(topic.id))
    expect(roadmap).toHaveLength(3)
    expect(Math.min(...roadmap.map((topic) => topic.y))).toBeGreaterThan(lowestRoadmapY)
  })

  it('pilihan di luar katalog ditolak', async () => {
    const agent = await registerAgent(app)
    const response = await agent.post('/api/rencana').send({ ...PLAN, subjects: ['Fisika'] })
    expect(response.status).toBe(400)
    expect(messagesOf(response.body)).toContain('Fisika tidak ada di SD.')
  })

  it('kelas yang tidak ada di jenjang ditolak', async () => {
    const agent = await registerAgent(app)
    const response = await agent.post('/api/rencana').send({ ...PLAN, grade: 7 })
    expect(response.status).toBe(400)
    expect(messagesOf(response.body)).toContain('Kelas 7 tidak ada untuk SD.')
  })

  it('materi harus dari mata pelajaran yang dipilih', async () => {
    const agent = await registerAgent(app)
    const response = await agent.post('/api/rencana').send({
      ...PLAN,
      subjects: ['Matematika'],
      topics: [{ subject: 'IPA', name: 'Tubuh manusia' }],
    })
    expect(response.status).toBe(400)
    expect(messagesOf(response.body)).toContain('Tubuh manusia harus dari mata pelajaran yang dipilih.')
  })

  it('materi yang tidak ada di mata pelajarannya ditolak', async () => {
    const agent = await registerAgent(app)
    const response = await agent.post('/api/rencana').send({
      ...PLAN,
      topics: [{ subject: 'Matematika', name: 'Tubuh manusia' }],
    })
    expect(response.status).toBe(400)
    expect(messagesOf(response.body)).toContain('Tubuh manusia tidak ada di Matematika.')
  })

  it('minimal satu mata pelajaran harus dipilih', async () => {
    const agent = await registerAgent(app)
    const response = await agent.post('/api/rencana').send({ ...PLAN, subjects: [] })
    expect(response.status).toBe(400)
    expect(messagesOf(response.body)).toContain('Pilih minimal satu mata pelajaran.')
  })
})
