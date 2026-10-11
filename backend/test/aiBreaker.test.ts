import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { AiUnavailableError } from '../src/ai/errors.js'
import { AiService } from '../src/ai/service.js'

// Every call fails with a server error, and the test records which model each call was sent to.
function failingService(chainKuis: string[]) {
  const models: string[] = []
  const fetchImpl = (async (_url: string | URL | Request, init?: RequestInit) => {
    models.push((JSON.parse(String(init?.body)) as { model: string }).model)
    return new Response('{}', { status: 503 })
  }) as unknown as typeof fetch
  const service = new AiService({
    mode: 'live',
    apiKey: 'kunci-uji',
    baseUrl: 'https://model.uji',
    chains: { chat: ['chat-a'], kuis: chainKuis, ringan: ['ringan-a'] },
    timeoutMs: { chat: 5000, kuis: 5000, ringan: 5000 },
    maxTokens: { chat: 1200, kuis: 3000 },
    reasoningEffort: { chat: 'low', kuis: 'medium', ringan: 'low' },
    fetchImpl,
    mockDelayMs: 0,
  })
  const ask = () => service.complete({ task: 'KUIS_GENERATE', system: 's', user: 'u', schema: z.unknown(), mock: () => '' })
  return { models, ask }
}

describe('pendinginan model', () => {
  it('dengan satu model di rantai, model tetap dicoba walau sudah tiga kali gagal', async () => {
    const { models, ask } = failingService(['satu-model'])
    for (let index = 0; index < 3; index++) {
      await expect(ask()).rejects.toBeInstanceOf(AiUnavailableError)
    }
    await expect(ask()).rejects.toBeInstanceOf(AiUnavailableError)
    expect(models.filter((model) => model === 'satu-model')).toHaveLength(4)
  })

  it('dengan dua model, model yang sudah didinginkan dilewati', async () => {
    const { models, ask } = failingService(['pertama', 'kedua'])
    await expect(ask()).rejects.toBeInstanceOf(AiUnavailableError)
    await expect(ask()).rejects.toBeInstanceOf(AiUnavailableError)
    await expect(ask()).rejects.toBeInstanceOf(AiUnavailableError)
    const before = models.length
    await expect(ask()).rejects.toBeInstanceOf(AiUnavailableError)
    // Both models were tried before the cooldown, and none of them is tried after it.
    expect(models.slice(before)).toEqual([])
  })
})
