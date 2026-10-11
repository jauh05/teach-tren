import request from 'supertest'
import { beforeEach, describe, expect, it } from 'vitest'
import { prisma } from '../src/db.js'
import { runCleanup } from '../src/jobs/cleanup.js'
import { SlidingWindowLimiter } from '../src/chat/rateLimit.js'
import { createTestApp, registerAgent, resetDatabase } from './helpers.js'

const app = createTestApp()
const GUEST = '11111111-2222-4333-8444-555555555555'
const DAY = 24 * 60 * 60 * 1000

// Every write endpoint that needs a signed-in user. A guest must get 403 HANYA_MASUK, and no identity 401.
const MEMBER_ONLY: { method: 'get' | 'post' | 'put' | 'patch' | 'delete'; path: string; body?: object }[] = [
  { method: 'post', path: '/api/topics', body: { name: 'Baru' } },
  { method: 'patch', path: '/api/topics/bilangan', body: { name: 'Ganti' } },
  { method: 'post', path: '/api/topics/bilangan/scores', body: { percent: 50 } },
  { method: 'put', path: '/api/conversations/sel', body: { messages: [] } },
  { method: 'patch', path: '/api/conversations/sel', body: { title: 'Judul' } },
  { method: 'delete', path: '/api/conversations/sel' },
  { method: 'delete', path: '/api/conversations' },
  { method: 'post', path: '/api/materi/x/link', body: { topicId: 'bilangan' } },
  { method: 'post', path: '/api/jadwal/item', body: { date: '2026-10-12', title: 'Latihan' } },
  { method: 'patch', path: '/api/jadwal/item/x', body: { accept: true } },
  { method: 'delete', path: '/api/jadwal/item/x' },
  { method: 'patch', path: '/api/auth/me', body: { name: 'Nama' } },
  { method: 'post', path: '/api/auth/password', body: { currentPassword: 'a', newPassword: 'kata-sandi-baru' } },
  { method: 'delete', path: '/api/auth/me', body: { password: 'a' } },
  { method: 'get', path: '/api/topics' },
  { method: 'get', path: '/api/conversations' },
  { method: 'get', path: '/api/jadwal' },
  { method: 'get', path: '/api/memori' },
  { method: 'get', path: '/api/materi' },
]

describe('batas tamu di backend', () => {
  beforeEach(resetDatabase)

  it.each(MEMBER_ONLY)('$method $path: tamu mendapat 403 HANYA_MASUK', async ({ method, path, body }) => {
    const call = request(app)[method](path).set('X-Guest-Id', GUEST)
    const response = body ? await call.send(body) : await call
    expect(response.status).toBe(403)
    expect(response.body.kode).toBe('HANYA_MASUK')
  })

  it.each(MEMBER_ONLY)('$method $path: tanpa identitas mendapat 401', async ({ method, path, body }) => {
    const call = request(app)[method](path)
    const response = body ? await call.send(body) : await call
    expect(response.status).toBe(401)
  })

  it('tamu tetap bisa membuat kuis dan chat, karena keduanya diatur kuota', async () => {
    const chat = await request(app).post('/api/conversations/x/messages').set('X-Guest-Id', GUEST).send({ content: 'halo' })
    expect(chat.status).toBe(200)
    const quiz = await request(app).post('/api/kuis/generate').set('X-Guest-Id', GUEST).send({ sumberId: 'x', count: 5, level: 'Sedang', style: 'Campuran' })
    expect(quiz.status).toBe(201)
  })
})

describe('header dan batas waktu', () => {
  it('setiap respons punya X-Request-Id dan header keamanan dari helmet', async () => {
    const response = await request(app).get('/api/health')
    expect(response.headers['x-request-id']).toMatch(/^[A-Za-z0-9_-]{8,100}$/)
    expect(response.headers['x-content-type-options']).toBe('nosniff')
    expect(response.headers['x-powered-by']).toBeUndefined()
  })

  it('X-Request-Id dari pemanggil dipakai kembali bila formatnya benar', async () => {
    const response = await request(app).get('/api/health').set('X-Request-Id', 'permintaan-uji-123')
    expect(response.headers['x-request-id']).toBe('permintaan-uji-123')
    const invalid = await request(app).get('/api/health').set('X-Request-Id', 'tidak valid!!')
    expect(invalid.headers['x-request-id']).not.toBe('tidak valid!!')
  })
})

describe('pembersihan data', () => {
  beforeEach(resetDatabase)

  it('menghapus tamu tidak aktif, kuis tamu lama, dan akun yang sudah lewat 30 hari', async () => {
    await prisma.guestUsage.createMany({
      data: [
        { guestId: 'tamu-lama', actions: 2 },
        { guestId: 'tamu-baru', actions: 1 },
      ],
    })
    await prisma.$executeRaw`UPDATE "GuestUsage" SET "updatedAt" = now() - interval '40 days' WHERE "guestId" = 'tamu-lama'`
    await prisma.quizRun.create({ data: { guestId: 'tamu-lama', topicName: 'Lama', subject: 'Umum', level: 'Sedang', style: 'Campuran', count: 5, stimuli: [], createdAt: new Date(Date.now() - 10 * DAY) } })

    const owner = await registerAgent(app, 'hapus@contoh.id')
    const user = await owner.get('/api/auth/me')
    const oldUser = user.body.user.id
    await prisma.user.update({ where: { id: oldUser }, data: { deletionScheduledAt: new Date(Date.now() - 40 * DAY) } })
    const recent = await registerAgent(app, 'masih@contoh.id')
    const recentUser = (await recent.get('/api/auth/me')).body.user.id
    await prisma.user.update({ where: { id: recentUser }, data: { deletionScheduledAt: new Date(Date.now() - 5 * DAY) } })

    const result = await runCleanup()
    expect(result).toEqual({ guestUsage: 1, guestQuizzes: 1, accounts: 1 })
    expect(await prisma.guestUsage.findUnique({ where: { guestId: 'tamu-baru' } })).not.toBeNull()
    expect(await prisma.user.findUnique({ where: { id: oldUser } })).toBeNull()
    expect(await prisma.user.findUnique({ where: { id: recentUser } })).not.toBeNull()
  })

  it('batas per jam menolak hit berikutnya sampai jendelanya lewat', () => {
    const limiter = new SlidingWindowLimiter(3, 60 * 60 * 1000)
    expect([limiter.take('k', 0), limiter.take('k', 1), limiter.take('k', 2), limiter.take('k', 3)]).toEqual([true, true, true, false])
    expect(limiter.take('k', 60 * 60 * 1000 + 5)).toBe(true)
  })
})
