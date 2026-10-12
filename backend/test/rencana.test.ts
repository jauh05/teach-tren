import { beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'
import { prisma } from '../src/db.js'
import { createTestApp, registerAgent, resetDatabase } from './helpers.js'

const app = createTestApp()

// Six branches: four in Matematika and two in IPA.
const PLAN = {
  levelId: 'sd',
  grade: 4,
  subjects: ['Matematika', 'IPA'],
  topics: [
    { subject: 'Matematika', name: 'Bilangan cacah' },
    { subject: 'Matematika', name: 'Pecahan sederhana' },
    { subject: 'Matematika', name: 'Bangun datar' },
    { subject: 'Matematika', name: 'Pengukuran' },
    { subject: 'IPA', name: 'Tubuh manusia' },
    { subject: 'IPA', name: 'Siklus air' },
  ],
}

// Validation errors carry one message per field in "rincian". The top-level "pesan" is the same for all of them.
function messagesOf(body: { rincian?: { pesan: string }[] }): string[] {
  return (body.rincian ?? []).map((issue) => issue.pesan)
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

  it('rencana membuat satu neuron per cabang, dengan satu jalur per mata pelajaran', async () => {
    const agent = await registerAgent(app)
    const saved = await agent.post('/api/rencana').send(PLAN)
    expect(saved.status).toBe(201)
    expect(saved.body.bulat).toBe(6)
    expect(saved.body.rencana.subjects).toEqual(['Matematika', 'IPA'])

    const user = await prisma.user.findUniqueOrThrow({ where: { email: 'siswa@contoh.id' } })
    const topics = await prisma.topic.findMany({ where: { userId: user.id } })
    const byName = Object.fromEntries(topics.map((topic) => [topic.name, topic]))
    const matematika = topics.filter((topic) => topic.subject === 'Matematika')
    const ipa = topics.filter((topic) => topic.subject === 'IPA')
    expect(matematika.map((topic) => topic.name).sort()).toEqual(['Bangun datar', 'Bilangan cacah', 'Pecahan sederhana', 'Pengukuran'])
    // The second subject starts below the first one.
    expect(Math.min(...ipa.map((topic) => topic.y))).toBeGreaterThan(Math.max(...matematika.map((topic) => topic.y)))

    // The path links the branches one after another, through both subjects. Neighbors are also linked, but dashed.
    const links = await prisma.topicLink.findMany({ where: { userId: user.id } })
    const path = links.filter((link) => !link.suggested)
    expect(path).toContainEqual(expect.objectContaining({ sourceId: byName['Bilangan cacah'].id, targetId: byName['Pecahan sederhana'].id }))
    expect(path).toContainEqual(expect.objectContaining({ sourceId: byName['Pengukuran'].id, targetId: byName['Tubuh manusia'].id }))
    expect(path).toHaveLength(5)
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

  it('roadmap harus punya 6 sampai 12 cabang', async () => {
    const agent = await registerAgent(app)
    const tooFew = await agent.post('/api/rencana').send({ ...PLAN, topics: PLAN.topics.slice(0, 5) })
    expect(tooFew.status).toBe(400)
    expect(tooFew.body.pesan).toBe('Data yang dikirim tidak valid.')

    const extra = Array.from({ length: 7 }, (_, index) => ({ subject: 'Matematika', name: `Cabang ${index + 1}` }))
    const tooMany = await agent.post('/api/rencana').send({ ...PLAN, topics: [...PLAN.topics, ...extra] })
    expect(tooMany.status).toBe(400)
  })

  it('nama cabang dari AI boleh di luar daftar kurikulum', async () => {
    const agent = await registerAgent(app)
    const topics = [
      { subject: 'Matematika', name: 'Menghitung dengan jari' },
      { subject: 'Matematika', name: 'Tebak bilangan' },
      { subject: 'Matematika', name: 'Pola bilangan' },
      { subject: 'Matematika', name: 'Hitung cepat' },
      { subject: 'IPA', name: 'Hewan di sekitar' },
      { subject: 'IPA', name: 'Tanaman rumah' },
    ]
    const saved = await agent.post('/api/rencana').send({ ...PLAN, topics })
    expect(saved.status).toBe(201)
    expect(saved.body.bulat).toBe(6)
  })

  it('cabang yang namanya sudah dipakai neuron lain dilewati', async () => {
    const agent = await registerAgent(app)
    await agent.post('/api/topics').send({ name: 'pecahan sederhana' }).expect(201)
    const saved = await agent.post('/api/rencana').send(PLAN)
    expect(saved.status).toBe(201)
    expect(saved.body.bulat).toBe(5)
  })

  it('roadmap diletakkan di bawah neuron yang sudah ada', async () => {
    const agent = await registerAgent(app)
    await agent.post('/api/topics').send({ name: 'Neuron lama' }).expect(201)
    const user = await prisma.user.findUniqueOrThrow({ where: { email: 'siswa@contoh.id' } })
    const existing = await prisma.topic.findMany({ where: { userId: user.id } })
    const existingIds = new Set(existing.map((topic) => topic.id))
    const lowestRoadmapY = Math.max(...existing.map((topic) => topic.y))

    await agent.post('/api/rencana').send(PLAN).expect(201)
    const created = await prisma.topic.findMany({ where: { userId: user.id } })
    const roadmap = created.filter((topic) => !existingIds.has(topic.id))
    expect(roadmap).toHaveLength(6)
    expect(Math.min(...roadmap.map((topic) => topic.y))).toBeGreaterThan(lowestRoadmapY)
  })

  it('pilihan di luar katalog ditolak', async () => {
    const agent = await registerAgent(app)
    const response = await agent.post('/api/rencana').send({ ...PLAN, subjects: ['Fisika'], topics: [] })
    expect(response.status).toBe(400)
    expect(messagesOf(response.body)).toContain('Fisika tidak ada di SD.')
  })

  it('kelas yang tidak ada di jenjang ditolak', async () => {
    const agent = await registerAgent(app)
    const response = await agent.post('/api/rencana').send({ ...PLAN, grade: 7 })
    expect(response.status).toBe(400)
    expect(messagesOf(response.body)).toContain('Kelas 7 tidak ada untuk SD.')
  })

  it('cabang harus dari mata pelajaran yang dipilih', async () => {
    const agent = await registerAgent(app)
    const response = await agent.post('/api/rencana').send({ ...PLAN, subjects: ['Matematika'] })
    expect(response.status).toBe(400)
    expect(messagesOf(response.body)).toContain('Tubuh manusia harus dari mata pelajaran yang dipilih.')
  })

  it('minimal satu mata pelajaran harus dipilih', async () => {
    const agent = await registerAgent(app)
    const response = await agent.post('/api/rencana').send({ ...PLAN, subjects: [] })
    expect(response.status).toBe(400)
    expect(messagesOf(response.body)).toContain('Pilih minimal satu mata pelajaran.')
  })
})

describe('roadmap dari AI atau katalog', () => {
  beforeEach(resetDatabase)

  it('tamu tidak bisa membuat roadmap', async () => {
    const response = await request(app).post('/api/rencana/roadmap').set('X-Guest-Id', crypto.randomUUID()).send({ levelId: 'sd', grade: 4, subjects: ['Matematika'] })
    expect(response.status).toBe(403)
  })

  it('roadmap berisi 6 sampai 12 cabang dari mata pelajaran yang dipilih', async () => {
    const agent = await registerAgent(app)
    const response = await agent.post('/api/rencana/roadmap').send({ levelId: 'sd', grade: 4, subjects: ['Matematika', 'IPA'] })
    expect(response.status).toBe(200)
    expect(response.body.cabang.length).toBeGreaterThanOrEqual(6)
    expect(response.body.cabang.length).toBeLessThanOrEqual(12)
    const subjects = new Set(response.body.cabang.map((item: { mapel: string }) => item.mapel))
    expect([...subjects].sort()).toEqual(['IPA', 'Matematika'])
    // Mock mode (the test setting) builds the roadmap from the curriculum list.
    expect(response.body.sumber).toBe('katalog')
  })

  it('pilihan roadmap yang tidak sesuai katalog ditolak', async () => {
    const agent = await registerAgent(app)
    const response = await agent.post('/api/rencana/roadmap').send({ levelId: 'sd', grade: 4, subjects: ['Fisika'] })
    expect(response.status).toBe(400)
    expect(messagesOf(response.body)).toContain('Fisika tidak ada di SD.')
  })
})
