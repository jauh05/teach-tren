// Model test for docs/role.md section 7.4. It asks each model for 100 quiz questions with the same prompt and schema the app uses,
// then records JSON validity, response time, and a sample of questions for a manual key check.
//
// Usage: npm run eval:model -- --out <folder>       (live, costs OpenRouter credit)
//        npm run eval:model -- --dry-run --out <folder>  (fake answers, no cost)
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { parseModelOutput, stripFences } from '../src/ai/normalize.js'
import { completeText, ProviderError, type ProviderCall, type ProviderSettings } from '../src/ai/openrouter.js'
import { quizBatchPrompt } from '../src/ai/prompts.js'
import { kuisBatchSchema } from '../src/ai/quizSchemas.js'
import { compositionFor } from '../src/kuis/composition.js'

// Same settings the app uses for quiz generation (backend/.env: AI_EFFORT_KUIS, AI_MAX_TOKENS_KUIS, AI_TIMEOUT_MS).
const MODELS = ['openai/gpt-oss-20b', 'nvidia/nemotron-3-ultra-550b-a55b:free']
const EFFORT = 'medium'
const MAX_TOKENS = 3000
const TIMEOUT_MS = 45000
const JSON_TEMPERATURE = 0.2
const BATCH_SIZE = 5
const LEVEL = 'Sedang'
const SAMPLE_SEED = 7

// Question counts from docs/role.md 7.4. Each subject uses a few topics, and batches cycle through them.
const PLAN = [
  { subject: 'Matematika', count: 30, topics: ['Persamaan linear', 'Bilangan', 'Fungsi kuadrat', 'Bangun datar', 'Pertidaksamaan'] },
  { subject: 'IPA', count: 30, topics: ['Sel tumbuhan', 'Fotosintesis', 'Gaya dan gerak', 'Sistem pernapasan', 'Ekosistem'] },
  { subject: 'Bahasa Indonesia', count: 20, topics: ['Teks eksposisi', 'Kalimat efektif', 'Majas', 'Teks narasi', 'Paragraf'] },
  { subject: 'IPS', count: 20, topics: ['Perubahan sosial', 'Koperasi', 'Peta dan mata angin', 'Keragaman budaya', 'Kegiatan ekonomi'] },
]

// Manual key check: 10 questions per model, 3 Matematika, 3 IPA, 2 Bahasa Indonesia, 2 IPS.
const SAMPLE_QUOTA: Record<string, number> = { Matematika: 3, IPA: 3, 'Bahasa Indonesia': 2, IPS: 2 }

const COMPOSITION = Object.entries(compositionFor(BATCH_SIZE, 'Campuran'))
  .filter(([, count]) => count > 0)
  .map(([kind, count]) => `${kind} ${count}`)
  .join(', ')

interface Planned {
  subject: string
  topic: string
  batch: number
  prompt: string
}

interface Question {
  subject: string
  topic: string
  tipe: string
  pertanyaan: string
  pilihan: { huruf: string; teks: string }[] | null
  kunci: string | null
  stimulusTeks: string | null
  pembahasan: string
  model: string
  batch: number
  position: number
}

interface CallResult {
  model: string
  subject: string
  topic: string
  batch: number
  ms: number
  httpError: string | null
  strictJson: boolean
  valid: boolean
  schemaError: string | null
  questions: Question[]
}

const dryRun = process.argv.includes('--dry-run')
const outFlag = process.argv.indexOf('--out')
const outDir = outFlag > 0 ? process.argv[outFlag + 1] : null
const apiKey = process.env.OPENROUTER_API_KEY ?? ''
const baseUrl = process.env.OPENROUTER_BASE_URL ?? 'https://openrouter.ai/api/v1'

if (!dryRun && apiKey === '') {
  throw new Error('OPENROUTER_API_KEY belum diisi di backend/.env.')
}

// Fake answer for --dry-run: one stimulus, three PG, one CERITA, one ESAI. It only tests the pipeline.
function fakeAnswer(): unknown {
  const option = (correct: string) => ['A', 'B', 'C', 'D'].map((huruf) => ({ huruf, teks: huruf === correct ? 'benar' : `pengecoh ${huruf}` }))
  return {
    stimulus: [{ id: 'S1', teks: 'Toko Sinar Ilmu menjual buku tulis dan pensil dengan harga berbeda. Harga satu buku tulis dicatat setiap hari selama sepekan di daftar harga toko.' }],
    soal: [
      { nomor: 1, tipe: 'PG', stimulusId: null, pertanyaan: 'Berapa hasil 2 + 3?', pilihan: option('A'), kunci: 'A', rubrik: null, pembahasan: 'Jumlah 2 dan 3 adalah 5.' },
      { nomor: 2, tipe: 'PG', stimulusId: null, pertanyaan: 'Berapa hasil 4 + 4?', pilihan: option('B'), kunci: 'B', rubrik: null, pembahasan: 'Jumlah 4 dan 4 adalah 8.' },
      { nomor: 3, tipe: 'PG', stimulusId: null, pertanyaan: 'Berapa hasil 3 x 3?', pilihan: option('C'), kunci: 'C', rubrik: null, pembahasan: 'Hasil kali 3 dan 3 adalah 9.' },
      { nomor: 4, tipe: 'CERITA', stimulusId: 'S1', pertanyaan: 'Berapa harga satu buku tulis?', pilihan: option('D'), kunci: 'D', rubrik: null, pembahasan: 'Harga dibaca dari daftar harga.' },
      { nomor: 5, tipe: 'ESAI', stimulusId: null, pertanyaan: 'Jelaskan langkah menyelesaikan persamaan.', pilihan: null, kunci: null, rubrik: [{ poin: 'langkah', bobot: 50 }, { poin: 'hasil', bobot: 25 }, { poin: 'cek', bobot: 25 }], pembahasan: 'Pindahkan suku lalu bagi.' },
    ],
  }
}

const fakeFetch = (async () =>
  new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify(fakeAnswer()) } }] }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  })) as unknown as typeof fetch

const settings: ProviderSettings = { baseUrl, apiKey, fetchImpl: dryRun ? fakeFetch : fetch }

function plannedBatches(): Planned[] {
  return PLAN.flatMap(({ subject, count, topics }) =>
    Array.from({ length: count / BATCH_SIZE }, (_, batch) => {
      const topic = topics[batch % topics.length] ?? topics[0] ?? subject
      return {
        subject,
        topic,
        batch,
        prompt: quizBatchPrompt({ mapel: subject, topik: topic, tingkat: LEVEL.toLowerCase(), jumlah: BATCH_SIZE, komposisi: COMPOSITION }),
      }
    }),
  )
}

// Spending as OpenRouter reports it for this key. Only meaningful for live runs.
async function keyUsage(): Promise<number | null> {
  if (dryRun) {
    return null
  }
  // A failed check must not stop the test. The spending figure is left empty for that model instead.
  try {
    const response = await fetch(`${baseUrl}/auth/key`, { headers: { Authorization: `Bearer ${apiKey}` } })
    const body = (await response.json()) as { data?: { usage?: number } }
    return body.data?.usage ?? null
  } catch {
    return null
  }
}

async function runModel(model: string): Promise<CallResult[]> {
  const results: CallResult[] = []
  for (const item of plannedBatches()) {
    const call: ProviderCall = {
      model,
      messages: [
        { role: 'system', content: item.prompt },
        { role: 'user', content: `Buat ${BATCH_SIZE} soal sekarang.` },
      ],
      maxTokens: MAX_TOKENS,
      temperature: JSON_TEMPERATURE,
      timeoutMs: TIMEOUT_MS,
      reasoningEffort: EFFORT,
    }
    const started = performance.now()
    let raw: string | null = null
    let httpError: string | null = null
    try {
      raw = await completeText(settings, call)
    } catch (error) {
      httpError = error instanceof ProviderError ? error.message : 'galat tidak dikenal'
    }
    const ms = Math.round(performance.now() - started)

    let strictJson = false
    let valid = false
    let schemaError: string | null = null
    const questions: Question[] = []
    if (raw !== null) {
      try {
        JSON.parse(stripFences(raw))
        strictJson = true
      } catch {
        strictJson = false
      }
      // The app's own check: local fixes, then the schema. No repair call is made here.
      const parsed = parseModelOutput(raw, kuisBatchSchema(BATCH_SIZE))
      if (parsed.ok) {
        valid = true
        parsed.value.soal.forEach((question, position) => {
          const stimulus = parsed.value.stimulus.find((item) => item.id === question.stimulusId)
          questions.push({
            subject: item.subject,
            topic: item.topic,
            tipe: question.tipe,
            pertanyaan: question.pertanyaan,
            pilihan: question.pilihan,
            kunci: question.kunci,
            stimulusTeks: stimulus?.teks ?? null,
            pembahasan: question.pembahasan,
            model,
            batch: item.batch,
            position,
          })
        })
      } else {
        schemaError = parsed.error
      }
    }
    console.error(`[${model}] ${item.subject} batch ${item.batch + 1}: ${httpError ?? (valid ? 'valid' : 'gagal validasi')} ${ms} ms`)
    results.push({ model, subject: item.subject, topic: item.topic, batch: item.batch, ms, httpError, strictJson, valid, schemaError, questions })
  }
  return results
}

// Small seeded random generator, so the same run always picks the same sample.
function seededRandom(seed: number): () => number {
  let state = seed
  return () => {
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function sampleFor(questions: Question[]): Question[] {
  const random = seededRandom(SAMPLE_SEED)
  const picked: Question[] = []
  for (const [subject, quota] of Object.entries(SAMPLE_QUOTA)) {
    // Only choice and fill-in questions with a key can be checked. Essays are graded by rubric, and the model may
    // send an empty string as their key, so the type is checked as well.
    const pool = questions.filter((question) => question.subject === subject && question.tipe !== 'ESAI' && question.kunci !== null && question.kunci !== '')
    const copy = [...pool]
    for (let index = 0; index < quota && copy.length > 0; index++) {
      const at = Math.floor(random() * copy.length)
      picked.push(...copy.splice(at, 1))
    }
  }
  return picked
}

function percentile(values: number[], p: number): number {
  if (values.length === 0) {
    return 0
  }
  const sorted = [...values].sort((a, b) => a - b)
  return sorted[Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1)] ?? 0
}

const report: Record<string, unknown> = { dryRun, startedAt: new Date().toISOString(), models: {} }
const samples: Record<string, Question[]> = {}

// Written after every model, so a failure later does not lose the answers already received.
function save(): void {
  if (!outDir) {
    return
  }
  mkdirSync(outDir, { recursive: true })
  writeFileSync(join(outDir, 'model-eval-raw.json'), JSON.stringify(report, null, 2))
  writeFileSync(join(outDir, 'model-eval-sampel.json'), JSON.stringify(samples, null, 2))
}

for (const model of MODELS) {
  const before = await keyUsage()
  const results = await runModel(model)
  const after = await keyUsage()
  const questions = results.flatMap((result) => result.questions)
  const times = results.map((result) => result.ms)
  samples[model] = sampleFor(questions)
  report.models = {
    ...(report.models as Record<string, unknown>),
    [model]: {
      batches: results.length,
      questionsRequested: results.length * BATCH_SIZE,
      httpErrors: results.filter((result) => result.httpError !== null).length,
      strictJsonBatches: results.filter((result) => result.strictJson).length,
      validBatches: results.filter((result) => result.valid).length,
      validQuestions: questions.length,
      msMedian: percentile(times, 50),
      msP90: percentile(times, 90),
      spendUsd: before !== null && after !== null ? Number((after - before).toFixed(6)) : null,
      schemaErrors: results.filter((result) => result.schemaError !== null).map((result) => `${result.subject} ${result.batch + 1}: ${result.schemaError}`),
      results,
    },
  }
  save()
}

// Summary without the raw answers, so it stays readable in the terminal.
const summary = Object.fromEntries(
  Object.entries(report.models as Record<string, Record<string, unknown>>).map(([model, data]) => {
    const { results: _results, schemaErrors, ...rest } = data
    return [model, { ...rest, schemaErrorCount: (schemaErrors as string[]).length, sampleSize: samples[model]?.length ?? 0 }]
  }),
)
console.log(JSON.stringify(summary, null, 2))
