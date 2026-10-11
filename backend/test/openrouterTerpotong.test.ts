import { describe, expect, it } from 'vitest'
import { ProviderError, completeText, finishReasonOf } from '../src/ai/openrouter.js'

const CALL = { model: 'uji', messages: [{ role: 'user' as const, content: 'uji' }], maxTokens: 10, temperature: 0, timeoutMs: 5000, reasoningEffort: 'low' as const }

function settingsFor(choice: Record<string, unknown>) {
  const fetchImpl = (async () => new Response(JSON.stringify({ choices: [choice] }), { status: 200 })) as unknown as typeof fetch
  return { baseUrl: 'https://model.uji', apiKey: 'kunci-uji', fetchImpl }
}

describe('jawaban yang terpotong', () => {
  it('finish_reason length gagal langsung tanpa dianggap teks', async () => {
    const settings = settingsFor({ finish_reason: 'length', message: { content: '{"soal":[' } })
    await expect(completeText(settings, CALL)).rejects.toBeInstanceOf(ProviderError)
    await expect(completeText(settings, CALL)).rejects.toThrow('keluaran terpotong')
  })

  it('finish_reason stop mengembalikan teks seperti biasa', async () => {
    expect(await completeText(settingsFor({ finish_reason: 'stop', message: { content: 'halo' } }), CALL)).toBe('halo')
  })

  it('finishReasonOf membaca alasan berhenti dari respons', () => {
    expect(finishReasonOf({ choices: [{ finish_reason: 'length' }] })).toBe('length')
    expect(finishReasonOf({})).toBeNull()
  })
})
