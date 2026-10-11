import request from 'supertest'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { prisma } from '../src/db.js'
import { runCleanup } from '../src/jobs/cleanup.js'
import { createTestApp, registerAgent, resetDatabase, TEST_PASSWORD } from './helpers.js'

// The limits are read from the environment when the app is built, so the app is built again with the values the test needs.
async function appWith(env: Record<string, string>) {
  vi.resetModules()
  for (const [name, value] of Object.entries(env)) {
    vi.stubEnv(name, value)
  }
  const { createApp } = await import('../src/app.js')
  return createApp({ corsOrigin: 'http://localhost:5173' })
}

describe('batas percobaan masuk dan daftar', () => {
  beforeEach(resetDatabase)
  afterEach(() => vi.unstubAllEnvs())

  it('percobaan masuk berlebihan ditolak, tetapi pemilik akun dari alamat lain tetap bisa masuk', async () => {
    const app = await appWith({ AUTH_ATTEMPTS_PER_15_MIN: '3', TRUST_PROXY: '1' })
    await request(app).post('/api/auth/register').set('X-Forwarded-For', '203.0.113.1').send({ name: 'Siswa', email: 'batas@contoh.id', password: TEST_PASSWORD }).expect(201)

    const guess = () => request(app).post('/api/auth/login').set('X-Forwarded-For', '198.51.100.7').send({ email: 'batas@contoh.id', password: 'tebakan-salah-1' })
    for (let attempt = 0; attempt < 3; attempt++) {
      expect((await guess()).status).toBe(401)
    }
    const blocked = await guess()
    expect(blocked.status).toBe(429)
    expect(blocked.body.kode).toBe('TERLALU_CEPAT')
    expect(blocked.body.pesan).toBe('Terlalu banyak percobaan masuk. Coba lagi dalam beberapa menit.')

    const owner = await request(app).post('/api/auth/login').set('X-Forwarded-For', '203.0.113.50').send({ email: 'batas@contoh.id', password: TEST_PASSWORD })
    expect(owner.status).toBe(200)
  })

  it('pendaftaran berlebihan dari satu alamat ditolak', async () => {
    const app = await appWith({ REGISTER_PER_HOUR: '2' })
    for (const email of ['satu@contoh.id', 'dua@contoh.id']) {
      await request(app).post('/api/auth/register').send({ name: 'Siswa', email, password: TEST_PASSWORD }).expect(201)
    }
    const third = await request(app).post('/api/auth/register').send({ name: 'Siswa', email: 'tiga@contoh.id', password: TEST_PASSWORD })
    expect(third.status).toBe(429)
    expect(third.body.pesan).toBe('Terlalu banyak pendaftaran dari jaringan ini. Coba lagi nanti.')
  })
})

describe('ganti kata sandi dan pembersihan token', () => {
  const app = createTestApp()
  beforeEach(resetDatabase)

  it('ganti kata sandi mengakhiri sesi di perangkat lain, dan perangkat ini tetap masuk', async () => {
    const first = await registerAgent(app, 'ganti@contoh.id')
    const second = request.agent(app)
    await second.post('/api/auth/login').send({ email: 'ganti@contoh.id', password: TEST_PASSWORD }).expect(200)

    await first.post('/api/auth/password').send({ currentPassword: TEST_PASSWORD, newPassword: 'kata-sandi-baru-456' }).expect(204)

    expect((await second.post('/api/auth/refresh')).status).toBe(401)
    expect((await first.get('/api/auth/me')).status).toBe(200)
    expect((await request(app).post('/api/auth/login').send({ email: 'ganti@contoh.id', password: TEST_PASSWORD })).status).toBe(401)
    expect((await request(app).post('/api/auth/login').send({ email: 'ganti@contoh.id', password: 'kata-sandi-baru-456' })).status).toBe(200)
  })

  it('pembersihan menghapus token yang sudah kedaluwarsa, dan menyimpan token yang dicabut tetapi belum kedaluwarsa', async () => {
    const agent = await registerAgent(app, 'bersih@contoh.id')
    const userId = (await agent.get('/api/auth/me')).body.user.id
    await prisma.refreshToken.create({ data: { userId, tokenHash: 'kedaluwarsa', expiresAt: new Date(Date.now() - 1000) } })
    await prisma.refreshToken.create({ data: { userId, tokenHash: 'dicabut', expiresAt: new Date(Date.now() + 86_400_000), revokedAt: new Date() } })

    const result = await runCleanup()

    expect(result.refreshTokens).toBe(1)
    expect(await prisma.refreshToken.findUnique({ where: { tokenHash: 'kedaluwarsa' } })).toBeNull()
    expect(await prisma.refreshToken.findUnique({ where: { tokenHash: 'dicabut' } })).not.toBeNull()
  })
})

describe('akun baru', () => {
  beforeEach(resetDatabase)

  it('belum punya bulat, tanpa contoh jadwal, memori, atau percakapan', async () => {
    const app = createTestApp()
    const agent = request.agent(app)
    await agent.post('/api/auth/register').send({ name: 'Siswa Baru', email: 'baru@contoh.id', password: TEST_PASSWORD }).expect(201)

    const topics = await agent.get('/api/topics').expect(200)
    expect(topics.body.topics).toEqual([])
    expect(topics.body.links).toEqual([])
    expect((await agent.get('/api/jadwal').expect(200)).body.items).toEqual([])
    expect((await agent.get('/api/memori').expect(200)).body.entries).toEqual([])
    expect((await agent.get('/api/conversations').expect(200)).body.conversations).toEqual([])
    expect((await agent.get('/api/materi').expect(200)).body.materials).toEqual([])
  })

  it('bulat pertama dibuat dengan tambah bulat, lalu bisa diganti namanya', async () => {
    const agent = request.agent(createTestApp())
    await agent.post('/api/auth/register').send({ name: 'Siswa Baru', email: 'ganti@contoh.id', password: TEST_PASSWORD }).expect(201)
    const created = await agent.post('/api/topics').send({ name: 'Pecahan' }).expect(201)

    await agent.patch(`/api/topics/${created.body.topic.id}`).send({ name: 'Bangun datar' }).expect(200)

    const names = (await agent.get('/api/topics').expect(200)).body.topics.map((topic: { name: string }) => topic.name)
    expect(names).toEqual(['Bangun datar'])
  })
})
