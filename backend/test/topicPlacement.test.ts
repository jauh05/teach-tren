import { beforeEach, describe, expect, it } from 'vitest'
import { freePosition } from '../src/topics/placement.js'
import { createTestApp, registerAgent, resetDatabase } from './helpers.js'

const app = createTestApp()

describe('posisi bulat baru', () => {
  it('tanpa bulat lain, bulat baru berada di tengah kanvas', () => {
    expect(freePosition([])).toEqual({ x: 280, y: 170 })
  })

  it('tidak pernah berdekatan dengan bulat yang sudah ada', () => {
    const existing = [{ x: 280, y: 170 }, { x: 330, y: 170 }, { x: 280, y: 220 }]
    const spot = freePosition(existing)
    for (const point of existing) {
      expect(Math.hypot(point.x - spot.x, point.y - spot.y)).toBeGreaterThanOrEqual(60)
    }
  })

  describe('lewat API', () => {
    beforeEach(resetDatabase)

    it('tiga bulat baru tidak menumpuk dan tidak disimpan di (0, 0)', async () => {
      const agent = await registerAgent(app)
      for (const name of ['Pecahan', 'Desimal', 'Persen']) {
        await agent.post('/api/topics').send({ name }).expect(201)
      }

      const { body } = await agent.get('/api/topics').expect(200)
      const fresh = body.topics.filter((topic: { name: string }) => ['Pecahan', 'Desimal', 'Persen'].includes(topic.name))
      expect(fresh).toHaveLength(3)
      for (const topic of fresh) {
        expect(topic.x === 0 && topic.y === 0).toBe(false)
      }
      for (let index = 0; index < fresh.length; index++) {
        for (let other = index + 1; other < fresh.length; other++) {
          const distance = Math.hypot(fresh[index].x - fresh[other].x, fresh[index].y - fresh[other].y)
          expect(distance).toBeGreaterThanOrEqual(60)
        }
      }
    })
  })
})
