import request from 'supertest'
import { beforeEach, describe, expect, it } from 'vitest'
import { createTestApp, resetDatabase, TEST_PASSWORD } from './helpers.js'

const app = createTestApp()

// The raw refresh token from a Set-Cookie header.
function refreshValue(setCookie: string[] | string | undefined): string {
  const list = Array.isArray(setCookie) ? setCookie : setCookie ? [setCookie] : []
  const match = list.map((cookie) => /tt_segar=([^;]+)/.exec(cookie)).find((found) => found !== null)
  if (!match) {
    throw new Error('Tidak ada refresh token di respons.')
  }
  return match[1]
}

describe('refresh token', () => {
  beforeEach(resetDatabase)

  it('mendaftar memberi access cookie dan refresh token yang bisa dipakai untuk memperbarui sesi', async () => {
    const registered = await request(app).post('/api/auth/register').send({ name: 'Siswa', email: 'segar@contoh.id', password: TEST_PASSWORD })
    const first = refreshValue(registered.headers['set-cookie'])

    const refreshed = await request(app).post('/api/auth/refresh').set('Cookie', `tt_segar=${first}`)
    expect(refreshed.status).toBe(200)
    expect(refreshed.body.user.email).toBe('segar@contoh.id')
    expect(refreshValue(refreshed.headers['set-cookie'])).not.toBe(first)
  })

  it('refresh token yang sudah dipakai ditolak, dan semua sesi pengguna itu ikut berakhir', async () => {
    const registered = await request(app).post('/api/auth/register').send({ name: 'Siswa', email: 'ulang@contoh.id', password: TEST_PASSWORD })
    const first = refreshValue(registered.headers['set-cookie'])
    const refreshed = await request(app).post('/api/auth/refresh').set('Cookie', `tt_segar=${first}`)
    const second = refreshValue(refreshed.headers['set-cookie'])

    // Using the first token again is a copy. It fails, and the newest token stops working as well.
    const replay = await request(app).post('/api/auth/refresh').set('Cookie', `tt_segar=${first}`)
    expect(replay.status).toBe(401)
    const afterReplay = await request(app).post('/api/auth/refresh').set('Cookie', `tt_segar=${second}`)
    expect(afterReplay.status).toBe(401)
  })

  it('tanpa refresh token, pembaruan sesi ditolak', async () => {
    const response = await request(app).post('/api/auth/refresh')
    expect(response.status).toBe(401)
    expect(response.body.pesan).toBe('Sesi sudah berakhir. Masuk lagi.')
  })

  it('keluar mencabut refresh token yang dipakai', async () => {
    const registered = await request(app).post('/api/auth/register').send({ name: 'Siswa', email: 'keluar@contoh.id', password: TEST_PASSWORD })
    const token = refreshValue(registered.headers['set-cookie'])
    await request(app).post('/api/auth/logout').set('Cookie', `tt_segar=${token}`).expect(204)
    const after = await request(app).post('/api/auth/refresh').set('Cookie', `tt_segar=${token}`)
    expect(after.status).toBe(401)
  })
})
