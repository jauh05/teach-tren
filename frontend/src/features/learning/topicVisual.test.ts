import { describe, expect, it } from 'vitest'
import { TOPIC_VISUALS } from './topicVisual'

describe('TOPIC_VISUALS', () => {
  it('setiap status berdiameter 60 sampai 76 piksel pada zoom 100 persen', () => {
    for (const visual of Object.values(TOPIC_VISUALS)) {
      const diameter = visual.radius * 2
      expect(diameter).toBeGreaterThanOrEqual(60)
      expect(diameter).toBeLessThanOrEqual(76)
    }
  })

  it('status dikuasai, perlu diulang, dan belum dibuka memakai segel', () => {
    const sealed = Object.entries(TOPIC_VISUALS)
      .filter(([, visual]) => visual.seal !== undefined)
      .map(([status]) => status)
      .sort()
    expect(sealed).toEqual(['BELUM_DIBUKA', 'DIKUASAI', 'PERLU_DIULANG'])
  })

  it('status baru memakai label baru di atas bulat', () => {
    expect(TOPIC_VISUALS.BARU.tagLabel).toBe('baru')
  })
})
