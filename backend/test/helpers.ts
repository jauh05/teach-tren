import request from 'supertest'
import { createApp } from '../src/app.js'
import { prisma } from '../src/db.js'

export const TEST_PASSWORD = 'kata-sandi-uji-123'

export function createTestApp() {
  return createApp({ corsOrigin: 'http://localhost:5173' })
}

// Removes all rows. Refuses to run unless the database name ends with _test, so development data is safe.
export async function resetDatabase(): Promise<void> {
  const url = process.env.DATABASE_URL ?? ''
  if (!/_test(\?|$)/.test(url)) {
    throw new Error('Test hanya boleh berjalan di database yang namanya berakhiran _test.')
  }
  await prisma.$executeRawUnsafe(
    'TRUNCATE TABLE "GuestUsage", "Material", "QuizAttempt", "Message", "Conversation", "TopicLink", "Topic", "User" RESTART IDENTITY CASCADE',
  )
}

// Registers a new account and returns an agent that keeps the session cookie.
export async function registerAgent(app: ReturnType<typeof createTestApp>, email = 'siswa@contoh.id') {
  const agent = request.agent(app)
  const response = await agent.post('/api/auth/register').send({ name: 'Siswa Uji', email, password: TEST_PASSWORD })
  if (response.status !== 201) {
    throw new Error(`Gagal mendaftar untuk uji: ${response.status}`)
  }
  return agent
}
