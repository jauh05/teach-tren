import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { createTestApp } from './helpers.js'

const app = createTestApp()

describe('sesi tamu', () => {
  it('server memberi id tamu berbentuk UUID', async () => {
    const response = await request(app).post('/api/guest/session')
    expect(response.status).toBe(201)
    expect(response.body.guestId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)
  })

  it('id yang diberikan berbeda setiap kali', async () => {
    const first = await request(app).post('/api/guest/session')
    const second = await request(app).post('/api/guest/session')
    expect(first.body.guestId).not.toBe(second.body.guestId)
  })
})
