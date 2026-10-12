import request from 'supertest'
import { beforeEach, describe, expect, it } from 'vitest'
import { prisma } from '../src/db.js'
import { createTestApp, registerAgent, resetDatabase } from './helpers.js'

const app = createTestApp()
const GUEST = '5b1f0c2e-8a3d-4f6b-9e7a-1c2d3e4f5a6b'
const OTHER_GUEST = '7c2e1d3f-9b4a-4e7c-8f1b-2d3e4f5a6b7c'

// A guest makes one quiz on the device. Mock answers keep this fast.
async function guestQuiz(guestId: string) {
  const created = await request(app)
    .post('/api/kuis/generate')
    .set('X-Guest-Id', guestId)
    .send({ sumberId: 'persamaan-linear', count: 5, level: 'Sedang', style: 'Campuran' })
  expect(created.status).toBe(201)
  return created.body.quiz.id as string
}

describe('pindah hasil kuis tamu ke akun', () => {
  beforeEach(resetDatabase)

  it('hasil kuis dari perangkat tamu pindah ke akun yang masuk', async () => {
    const quizId = await guestQuiz(GUEST)
    const agent = await registerAgent(app, 'pindah@contoh.id')

    const imported = await agent.post('/api/kuis/import').send({ guestId: GUEST }).expect(200)
    expect(imported.body.kuis).toBe(1)

    const user = await prisma.user.findUniqueOrThrow({ where: { email: 'pindah@contoh.id' } })
    const run = await prisma.quizRun.findUniqueOrThrow({ where: { id: quizId } })
    expect(run.userId).toBe(user.id)
    expect(run.guestId).toBeNull()
  })

  it('hanya hasil dari perangkat yang mengimpor yang dipindahkan', async () => {
    const quizId = await guestQuiz(GUEST)
    const agent = await registerAgent(app, 'lain-perangkat@contoh.id')

    const imported = await agent.post('/api/kuis/import').send({ guestId: OTHER_GUEST }).expect(200)
    expect(imported.body.kuis).toBe(0)
    expect((await prisma.quizRun.findUniqueOrThrow({ where: { id: quizId } })).userId).toBeNull()
  })

  it('impor yang diulang tidak memindahkan apa-apa lagi', async () => {
    await guestQuiz(GUEST)
    const agent = await registerAgent(app, 'ulang@contoh.id')
    await agent.post('/api/kuis/import').send({ guestId: GUEST }).expect(200)

    const again = await agent.post('/api/kuis/import').send({ guestId: GUEST }).expect(200)
    expect(again.body.kuis).toBe(0)
  })

  it('tamu tidak bisa mengimpor, dan id yang bukan UUID ditolak', async () => {
    const guest = await request(app).post('/api/kuis/import').set('X-Guest-Id', GUEST).send({ guestId: GUEST })
    expect(guest.status).toBe(403)
    expect(guest.body.kode).toBe('HANYA_MASUK')

    const agent = await registerAgent(app, 'uuid@contoh.id')
    expect((await agent.post('/api/kuis/import').send({ guestId: 'bukan-uuid' })).status).toBe(400)
  })
})
