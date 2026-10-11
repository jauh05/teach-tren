import request from 'supertest'
import { beforeEach, describe, expect, it } from 'vitest'
import { createTestApp, registerAgent, resetDatabase, TEST_PASSWORD } from './helpers.js'

const app = createTestApp()

describe('profil dan akun', () => {
  beforeEach(resetDatabase)

  it('nama tampilan bisa diubah, email tidak', async () => {
    const agent = await registerAgent(app)
    const response = await agent.patch('/api/auth/me').send({ name: 'Rafi Arkan' })
    expect(response.status).toBe(200)
    expect(response.body.user.name).toBe('Rafi Arkan')
    expect(response.body.user.email).toBe('siswa@contoh.id')
  })

  it('kata sandi lama yang salah ditolak', async () => {
    const agent = await registerAgent(app)
    const response = await agent.post('/api/auth/password').send({ currentPassword: 'salah', newPassword: 'kata-sandi-baru-456' })
    expect(response.status).toBe(400)
    expect(response.body.pesan).toBe('Kata sandi lama tidak sesuai.')
  })

  it('kata sandi berhasil diganti dan dipakai saat masuk berikutnya', async () => {
    const agent = await registerAgent(app)
    await agent.post('/api/auth/password').send({ currentPassword: TEST_PASSWORD, newPassword: 'kata-sandi-baru-456' }).expect(204)

    await request(app).post('/api/auth/login').send({ email: 'siswa@contoh.id', password: TEST_PASSWORD }).expect(401)
    await request(app).post('/api/auth/login').send({ email: 'siswa@contoh.id', password: 'kata-sandi-baru-456' }).expect(200)
  })

  it('hapus akun butuh kata sandi, menghentikan sesi, dan bisa dipulihkan dengan masuk lagi', async () => {
    const agent = await registerAgent(app)
    await agent.delete('/api/auth/me').send({ password: 'salah' }).expect(400)
    await agent.delete('/api/auth/me').send({ password: TEST_PASSWORD }).expect(204)
    await agent.get('/api/auth/me').expect(401)

    const restored = await request(app).post('/api/auth/login').send({ email: 'siswa@contoh.id', password: TEST_PASSWORD })
    expect(restored.status).toBe(200)
    const topics = await request.agent(app).get('/api/topics')
    expect(topics.status).toBe(401)
  })
})
