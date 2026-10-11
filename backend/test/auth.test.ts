import request from 'supertest'
import { beforeEach, describe, expect, it } from 'vitest'
import { createTestApp, registerAgent, resetDatabase, TEST_PASSWORD } from './helpers.js'

const app = createTestApp()

describe('akun', () => {
  beforeEach(resetDatabase)

  it('daftar membuat sesi dan memberi bulat awal', async () => {
    const agent = await registerAgent(app)
    const topics = await agent.get('/api/topics')
    expect(topics.status).toBe(200)
    expect(topics.body.topics).toHaveLength(9)
    expect(topics.body.links).toHaveLength(7)
    const me = await agent.get('/api/auth/me')
    expect(me.body.user.email).toBe('siswa@contoh.id')
  })

  it('menolak email yang sudah terdaftar', async () => {
    await registerAgent(app)
    const response = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Orang Lain', email: 'SISWA@contoh.id', password: TEST_PASSWORD })
    expect(response.status).toBe(409)
    expect(response.body.pesan).toBe('Email sudah terdaftar.')
  })

  it('menunjuk field email yang formatnya salah', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Siswa', email: 'bukan-email', password: TEST_PASSWORD })
    expect(response.status).toBe(400)
    expect(response.body.rincian).toContainEqual({ path: 'email', pesan: 'Format email tidak valid.' })
  })

  it('masuk dengan kata sandi salah ditolak tanpa membocorkan alasannya', async () => {
    await registerAgent(app)
    const response = await request(app).post('/api/auth/login').send({ email: 'siswa@contoh.id', password: 'salah-total' })
    expect(response.status).toBe(401)
    expect(response.body.pesan).toBe('Email atau kata sandi salah.')
  })

  it('masuk dengan email yang tidak ada memberi pesan yang sama', async () => {
    const response = await request(app).post('/api/auth/login').send({ email: 'tidak@ada.id', password: TEST_PASSWORD })
    expect(response.status).toBe(401)
    expect(response.body.pesan).toBe('Email atau kata sandi salah.')
  })

  it('tanpa sesi, halaman yang butuh masuk ditolak', async () => {
    const response = await request(app).get('/api/topics')
    expect(response.status).toBe(401)
    expect(response.body.pesan).toBe('Silakan masuk dulu.')
  })

  it('keluar menghapus sesi', async () => {
    const agent = await registerAgent(app)
    await agent.post('/api/auth/logout').expect(204)
    await agent.get('/api/auth/me').expect(401)
  })
})
