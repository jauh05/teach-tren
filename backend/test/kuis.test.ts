import request from 'supertest'
import { beforeEach, describe, expect, it } from 'vitest'
import { z } from 'zod'
import { AiService } from '../src/ai/service.js'
import { kuisBatchSchema } from '../src/ai/quizSchemas.js'
import { prisma } from '../src/db.js'
import { generateQuiz } from '../src/kuis/generate.js'
import { compositionFor } from '../src/kuis/composition.js'
import { gradeEssayByKeywords, gradeFill, normalizeAnswer } from '../src/kuis/grading.js'
import { createTestApp, registerAgent, registerWithExampleGraph, resetDatabase } from './helpers.js'

const app = createTestApp()
const GUEST = '11111111-2222-4333-8444-555555555555'

function batch(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    stimulus: [{ id: 'S1', teks: 'Rina membeli 3 pensil dengan harga yang sama. Total pembayaran Rina adalah Rp12.000 untuk semuanya.' }],
    soal: [
      { nomor: 1, tipe: 'PG', stimulusId: null, pertanyaan: 'Nilai x dari x + 5 = 12 adalah ...', pilihan: [{ huruf: 'A', teks: '5' }, { huruf: 'B', teks: '7' }, { huruf: 'C', teks: '12' }, { huruf: 'D', teks: '17' }], kunci: 'B', rubrik: null, pembahasan: 'Kurangi 5 dari kedua ruas.' },
      { nomor: 2, tipe: 'PG', stimulusId: null, pertanyaan: 'Nilai y dari 2y = 10 adalah ...', pilihan: [{ huruf: 'A', teks: '2' }, { huruf: 'B', teks: '5' }, { huruf: 'C', teks: '8' }, { huruf: 'D', teks: '20' }], kunci: 'B', rubrik: null, pembahasan: 'Bagi kedua ruas dengan 2.' },
      { nomor: 3, tipe: 'PG', stimulusId: null, pertanyaan: 'Nilai z dari 3z = 9 adalah ...', pilihan: [{ huruf: 'A', teks: '2' }, { huruf: 'B', teks: '3' }, { huruf: 'C', teks: '6' }, { huruf: 'D', teks: '27' }], kunci: 'B', rubrik: null, pembahasan: 'Bagi kedua ruas dengan 3.' },
      { nomor: 4, tipe: 'CERITA', stimulusId: 'S1', pertanyaan: 'Berapa harga satu pensil?', pilihan: [{ huruf: 'A', teks: 'Rp3.000' }, { huruf: 'B', teks: 'Rp4.000' }, { huruf: 'C', teks: 'Rp5.000' }, { huruf: 'D', teks: 'Rp6.000' }], kunci: 'B', rubrik: null, pembahasan: 'Bagi 12.000 dengan 3.' },
      { nomor: 5, tipe: 'ESAI', stimulusId: null, pertanyaan: 'Jelaskan cara menyelesaikan persamaan linear.', pilihan: null, kunci: null, rubrik: [{ poin: 'Memindahkan konstanta', bobot: 40 }, { poin: 'Membagi koefisien', bobot: 30 }, { poin: 'Memeriksa hasil', bobot: 30 }], pembahasan: 'Pindahkan konstanta, lalu bagi, lalu periksa.' },
    ],
    ...overrides,
  }
}

describe('komposisi dan penilaian kuis', () => {
  it('komposisi selalu berjumlah sama dengan jumlah soal', () => {
    for (const count of [5, 10, 15, 20]) {
      for (const style of ['Campuran', 'Pilihan ganda saja', 'Banyak cerita'] as const) {
        const composition = compositionFor(count, style)
        expect(Object.values(composition).reduce((sum, value) => sum + value, 0)).toBe(count)
      }
    }
    expect(compositionFor(10, 'Campuran')).toEqual({ PG: 5, CERITA: 3, ISIAN: 1, ESAI: 1 })
    expect(compositionFor(5, 'Pilihan ganda saja')).toEqual({ PG: 5, CERITA: 0, ISIAN: 0, ESAI: 0 })
  })

  it('jawaban isian menerima format angka Indonesia', () => {
    expect(normalizeAnswer('Rp4.000')).toBe('4000')
    expect(gradeFill('4.000', ['4000'])).toBe(100)
    expect(gradeFill(' 5000 ', ['4000'])).toBe(0)
    expect(gradeFill('   ', ['4000'])).toBe(0)
  })

  it('esai dengan kata kunci menandai jawaban pendek untuk ditinjau', () => {
    const rubric = [{ point: 'a', keywords: ['kurangi'], weight: 50 }, { point: 'b', keywords: ['bagi'], weight: 50 }]
    expect(gradeEssayByKeywords('kurangi lalu bagi dua sisi dengan benar', rubric)).toEqual({ score: 100, lowConfidence: false })
    expect(gradeEssayByKeywords('kurangi', rubric).lowConfidence).toBe(true)
  })
})

describe('skema soal dari AI', () => {
  it('batch yang benar lolos', () => {
    expect(kuisBatchSchema(5).safeParse(batch()).success).toBe(true)
  })

  it('pilihan yang kembar, kunci yang tidak ada, dan rubrik yang tidak berjumlah 100 ditolak', () => {
    const duplicate = batch()
    duplicate.soal[0].pilihan = [{ huruf: 'A', teks: '5' }, { huruf: 'B', teks: '5' }, { huruf: 'C', teks: '12' }, { huruf: 'D', teks: '17' }]
    expect(kuisBatchSchema(5).safeParse(duplicate).success).toBe(false)

    const missingKey = batch()
    missingKey.soal[1].kunci = 'E'
    expect(kuisBatchSchema(5).safeParse(missingKey).success).toBe(false)

    const badRubric = batch()
    badRubric.soal[4].rubrik = [{ poin: 'a', bobot: 40 }, { poin: 'b', bobot: 30 }, { poin: 'c', bobot: 20 }]
    expect(kuisBatchSchema(5).safeParse(badRubric).success).toBe(false)
  })

  it('jumlah soal yang tidak sesuai dan stimulus yang tidak ada ditolak', () => {
    expect(kuisBatchSchema(4).safeParse(batch()).success).toBe(false)
    const unknownStimulus = batch()
    unknownStimulus.soal[2].stimulusId = 'S9'
    expect(kuisBatchSchema(5).safeParse(unknownStimulus).success).toBe(false)
  })
})

describe('alur kuis', () => {
  beforeEach(resetDatabase)

  it('tamu membuat kuis tanpa kunci, dan kunci hanya muncul setelah dijawab', async () => {
    const created = await request(app).post('/api/kuis/generate').set('X-Guest-Id', GUEST).send({ sumberId: 'persamaan-linear', count: 10, level: 'Sedang', style: 'Campuran' })
    expect(created.status).toBe(201)
    const quiz = created.body.quiz
    expect(quiz.questions).toHaveLength(5)
    expect(JSON.stringify(quiz)).not.toContain('pembahasan')
    expect(quiz.questions[0]).not.toHaveProperty('answer')

    const item = quiz.questions.find((question: { type: string }) => question.type === 'PG')
    const answered = await request(app).post(`/api/kuis/${quiz.id}/jawaban/${item.id}`).set('X-Guest-Id', GUEST).send({ answer: 'A' })
    expect(answered.status).toBe(200)
    // The key is one of the four letters. Which one depends on the mock question.
    expect(['A', 'B', 'C', 'D']).toContain(answered.body.kunci)
    expect(answered.body).not.toHaveProperty('pembahasan')
  })

  it('kuota tamu habis setelah dua kuis', async () => {
    await request(app).post('/api/kuis/generate').set('X-Guest-Id', GUEST).send({ sumberId: 'x', count: 5, level: 'Sedang', style: 'Campuran' }).expect(201)
    await request(app).post('/api/kuis/generate').set('X-Guest-Id', GUEST).send({ sumberId: 'x', count: 5, level: 'Sedang', style: 'Campuran' }).expect(201)
    const blocked = await request(app).post('/api/kuis/generate').set('X-Guest-Id', GUEST).send({ sumberId: 'x', count: 5, level: 'Sedang', style: 'Campuran' })
    expect(blocked.status).toBe(429)
    expect(blocked.body.kode).toBe('KUOTA_HABIS')
  })

  it('pengguna masuk: nilai disimpan ke bulat, pembahasan tampil, dan ulangi soal salah tidak mengubah skor', async () => {
    const agent = await registerWithExampleGraph(app)
    const created = await agent.post('/api/kuis/generate').send({ sumberId: 'persamaan-linear', count: 5, level: 'Sedang', style: 'Campuran' })
    const quiz = created.body.quiz
    for (const item of quiz.questions) {
      if (item.type === 'ESAI') {
        await agent.post(`/api/kuis/${quiz.id}/jawaban/${item.id}`).send({ answer: 'Kurangi lalu bagi, periksa dengan substitusi.' }).expect(200)
      } else {
        await agent.post(`/api/kuis/${quiz.id}/jawaban/${item.id}`).send({ answer: 'Z' }).expect(200)
      }
    }
    const result = await agent.post(`/api/kuis/${quiz.id}/kumpul`)
    expect(result.status).toBe(200)
    expect(result.body.items.every((item: { pembahasan?: string }) => typeof item.pembahasan === 'string')).toBe(true)
    const topics = await agent.get('/api/topics')
    const topic = topics.body.topics.find((item: { id: string }) => item.id === 'persamaan-linear')
    expect(topic.lastScore).toBe(result.body.percent)

    const retry = await agent.post(`/api/kuis/${quiz.id}/ulangi-salah`)
    expect(retry.status).toBe(201)
    expect(retry.body.quiz.retry).toBe(true)
    expect(retry.body.quiz.questions.length).toBeGreaterThan(0)
    const retryAnswer = retry.body.quiz.questions[0]
    await agent.post(`/api/kuis/${retry.body.quiz.id}/jawaban/${retryAnswer.id}`).send({ answer: 'A' }).expect(200)
    await agent.post(`/api/kuis/${retry.body.quiz.id}/kumpul`).expect(200)
    const after = await agent.get('/api/topics')
    expect(after.body.topics.find((item: { id: string }) => item.id === 'persamaan-linear').lastScore).toBe(result.body.percent)
  })

  it('jawaban dua kali dan kuis milik orang lain ditolak', async () => {
    const owner = await registerAgent(app, 'pemilik@contoh.id')
    const quiz = (await owner.post('/api/kuis/generate').send({ sumberId: 'persamaan-linear', count: 5, level: 'Sedang', style: 'Campuran' })).body.quiz
    const item = quiz.questions.find((question: { type: string }) => question.type !== 'ESAI')
    await owner.post(`/api/kuis/${quiz.id}/jawaban/${item.id}`).send({ answer: 'A' }).expect(200)
    const again = await owner.post(`/api/kuis/${quiz.id}/jawaban/${item.id}`).send({ answer: 'B' })
    expect(again.status).toBe(409)

    const other = await registerAgent(app, 'lain@contoh.id')
    const stolen = await other.post(`/api/kuis/${quiz.id}/kumpul`)
    expect(stolen.status).toBe(404)
  })

  it('tanpa sesi dan tanpa X-Guest-Id, kuis ditolak', async () => {
    const response = await request(app).post('/api/kuis/generate').send({ sumberId: 'x', count: 5, level: 'Sedang', style: 'Campuran' })
    expect(response.status).toBe(401)
  })
})

describe('pembuatan soal dengan AI (jalur live, dengan respons tiruan)', () => {
  beforeEach(resetDatabase)

  it('soal dari AI diverifikasi, disimpan ke bank, lalu dipakai ulang tanpa memanggil AI', async () => {
    const calls: string[] = []
    const fetchImpl = (async (_url: string | URL | Request, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body)) as { messages: { content: string }[] }
      const system = body.messages[0].content
      const task = system.includes('Kamu membuat kumpulan soal') ? 'KUIS' : 'VERIFIKASI'
      calls.push(task)
      const content = task === 'KUIS'
        ? JSON.stringify(batch())
        : JSON.stringify({ hasil: [1, 2, 3, 4].map((nomor) => ({ nomor, benar: true, jawabanBenar: 'B' })) })
      return new Response(JSON.stringify({ choices: [{ message: { content } }] }), { status: 200 })
    }) as unknown as typeof fetch
    const service = new AiService({
      mode: 'live',
      apiKey: 'kunci-uji',
      baseUrl: 'https://model.uji',
      chains: { chat: ['m'], kuis: ['m'], ringan: ['m'] },
      timeoutMs: { chat: 5000, kuis: 5000, ringan: 5000 },
      maxTokens: { chat: 1200, kuis: 3000 },
      reasoningEffort: { chat: 'low', kuis: 'medium', ringan: 'low' },
      fetchImpl,
      mockDelayMs: 0,
    })
    const params = { sourceKey: 'persamaan-linear', topicName: 'Persamaan linear', subject: 'Matematika', level: 'Sedang' as const, style: 'Campuran' as const, count: 5, userId: null, mock: false }

    const first = await generateQuiz(service, params)
    expect(first.questions).toHaveLength(5)
    // Every batch that is generated is checked once, so the two counts match.
    expect(calls.filter((call) => call === 'KUIS').length).toBe(calls.filter((call) => call === 'VERIFIKASI').length)
    expect(await prisma.bankQuestion.count({ where: { topicKey: 'persamaan-linear' } })).toBe(5)

    calls.length = 0
    const second = await generateQuiz(service, params)
    expect(second.questions).toHaveLength(5)
    expect(calls).toEqual([])
  })

  it('AI yang gagal membuat kuis berhenti dengan pesan ramah', async () => {
    const fetchImpl = (async () => new Response('{}', { status: 503 })) as unknown as typeof fetch
    const service = new AiService({
      mode: 'live',
      apiKey: 'kunci-uji',
      baseUrl: 'https://model.uji',
      chains: { chat: ['m'], kuis: ['m'], ringan: ['m'] },
      timeoutMs: { chat: 5000, kuis: 5000, ringan: 5000 },
      maxTokens: { chat: 1200, kuis: 3000 },
      reasoningEffort: { chat: 'low', kuis: 'medium', ringan: 'low' },
      fetchImpl,
      mockDelayMs: 0,
    })
    await expect(
      generateQuiz(service, { sourceKey: 'baru', topicName: 'Baru', subject: 'Matematika', level: 'Mudah', style: 'Campuran', count: 5, userId: null, mock: false }),
    ).rejects.toThrow('Layanan belajar sedang sibuk')
  })

  it('batch yang gagal sekali dicoba lagi, dan kuis tetap jadi', async () => {
    const calls: string[] = []
    let quizCalls = 0
    const fetchImpl = (async (_url: string | URL | Request, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body)) as { messages: { content: string }[] }
      if (body.messages[0].content.includes('Kamu membuat kumpulan soal')) {
        quizCalls += 1
        calls.push('KUIS')
        if (quizCalls === 1) {
          return new Response('{}', { status: 503 })
        }
        return new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify(batch()) } }] }), { status: 200 })
      }
      calls.push('VERIFIKASI')
      const hasil = [1, 2, 3, 4].map((nomor) => ({ nomor, benar: true, jawabanBenar: 'B' }))
      return new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify({ hasil }) } }] }), { status: 200 })
    }) as unknown as typeof fetch
    const service = new AiService({
      mode: 'live',
      apiKey: 'kunci-uji',
      baseUrl: 'https://model.uji',
      chains: { chat: ['m'], kuis: ['m'], ringan: ['m'] },
      timeoutMs: { chat: 5000, kuis: 5000, ringan: 5000 },
      maxTokens: { chat: 1200, kuis: 3000 },
      reasoningEffort: { chat: 'low', kuis: 'medium', ringan: 'low' },
      fetchImpl,
      mockDelayMs: 0,
    })
    const quiz = await generateQuiz(service, { sourceKey: 'uji-ulang', topicName: 'Uji ulang', subject: 'Matematika', level: 'Sedang', style: 'Campuran', count: 5, userId: null, mock: false })
    expect(quiz.questions).toHaveLength(5)
    // A failed call is asked again, so there are more KUIS calls than batches.
    expect(calls.filter((call) => call === 'KUIS').length).toBeGreaterThanOrEqual(2)
  })

  it('batch yang gagal tiga kali berhenti setelah tiga kali mencoba', async () => {
    let quizCalls = 0
    const fetchImpl = (async () => {
      quizCalls += 1
      return new Response('{}', { status: 503 })
    }) as unknown as typeof fetch
    const service = new AiService({
      mode: 'live',
      apiKey: 'kunci-uji',
      baseUrl: 'https://model.uji',
      chains: { chat: ['m'], kuis: ['m'], ringan: ['m'] },
      timeoutMs: { chat: 5000, kuis: 5000, ringan: 5000 },
      maxTokens: { chat: 1200, kuis: 3000 },
      reasoningEffort: { chat: 'low', kuis: 'medium', ringan: 'low' },
      fetchImpl,
      mockDelayMs: 0,
    })
    await expect(
      generateQuiz(service, { sourceKey: 'uji-gagal-dua', topicName: 'Uji', subject: 'Matematika', level: 'Sedang', style: 'Campuran', count: 5, userId: null, mock: false }),
    ).rejects.toThrow('Layanan belajar sedang sibuk')
    // The batch is tried three times before the quiz gives up.
    expect(quizCalls).toBe(3)
  })
})

void z
