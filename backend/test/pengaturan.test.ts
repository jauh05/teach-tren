import request from 'supertest'
import { beforeEach, describe, expect, it } from 'vitest'
import { createTestApp, registerAgent, resetDatabase } from './helpers.js'

const app = createTestApp()

describe('pengaturan belajar di server', () => {
  beforeEach(resetDatabase)

  it('pengguna baru mendapat nilai default yang sama dengan halaman Pengaturan', async () => {
    const agent = await registerAgent(app)
    const response = await agent.get('/api/pengaturan/preferensi')
    expect(response.status).toBe(200)
    expect(response.body.preferensi).toEqual({
      questionCount: 10,
      level: 'Sedang',
      quizStyle: 'Campuran',
      quickChoiceAfterMaterial: true,
      theme: 'light',
      reminderEnabled: true,
      reminderTime: '16:00',
    })
  })

  it('perubahan tersimpan dan terbaca dari perangkat lain', async () => {
    const agent = await registerAgent(app)
    const saved = await agent.put('/api/pengaturan/preferensi').send({
      questionCount: 20,
      level: 'Sulit',
      quizStyle: 'Banyak cerita',
      quickChoiceAfterMaterial: false,
      theme: 'system',
      reminderEnabled: false,
      reminderTime: '07:30',
    })
    expect(saved.status).toBe(200)

    const elsewhere = await request.agent(app).post('/api/auth/login').send({ email: 'siswa@contoh.id', password: 'kata-sandi-uji-123' })
    expect(elsewhere.status).toBe(200)
    const again = await agent.get('/api/pengaturan/preferensi')
    expect(again.body.preferensi.reminderTime).toBe('07:30')
    expect(again.body.preferensi.questionCount).toBe(20)
  })

  it('nilai di luar pilihan dan jam yang salah ditolak', async () => {
    const agent = await registerAgent(app)
    const badCount = await agent.put('/api/pengaturan/preferensi').send({
      questionCount: 7, level: 'Sedang', quizStyle: 'Campuran', quickChoiceAfterMaterial: true, theme: 'light', reminderEnabled: true, reminderTime: '16:00',
    })
    expect(badCount.status).toBe(400)
    const badTime = await agent.put('/api/pengaturan/preferensi').send({
      questionCount: 10, level: 'Sedang', quizStyle: 'Campuran', quickChoiceAfterMaterial: true, theme: 'light', reminderEnabled: true, reminderTime: '25:00',
    })
    expect(badTime.body.rincian[0].path).toBe('reminderTime')
  })

  it('tamu tidak bisa menyimpan pengaturan ke akun', async () => {
    const response = await request(app).put('/api/pengaturan/preferensi').set('X-Guest-Id', '11111111-2222-4333-8444-555555555555').send({})
    expect(response.status).toBe(403)
  })
})
