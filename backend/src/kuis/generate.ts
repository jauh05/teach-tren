import { randomUUID } from 'node:crypto'
import { AiUnavailableError } from '../ai/errors.js'
import type { AiService } from '../ai/service.js'
import { quizBatchPrompt, verifyKeyPrompt } from '../ai/prompts.js'
import { kuisBatchSchema, verificationSchema, type KuisBatch, type Verification } from '../ai/quizSchemas.js'
import { prisma } from '../db.js'
import type { Prisma } from '../generated/prisma/client.js'
import { compositionFor } from './composition.js'
import { keywordsOf } from './grading.js'
import { MOCK_STIMULUS, mockQuestions } from './mockBank.js'
import type { Level, QuestionData, QuestionKind, RubricData, StimulusData, Style } from './types.js'

// Generation (docs/role.md section 9): bank first, then AI in batches of at most five questions.
const BATCH_SIZE = 5
const MAX_ROUNDS = 4
const ORDER: QuestionKind[] = ['PG', 'CERITA', 'ISIAN', 'ESAI']
// Only math and science keys are checked a second time (docs/role.md CC-07, rule 7).
const CHECKED_SUBJECTS = ['Matematika', 'IPA']

export interface GenerateParams {
  sourceKey: string
  topicName: string
  subject: string
  level: Level
  style: Style
  count: number
  // Signed-in users skip questions they have already done. Guests have no such history.
  userId: string | null
  mock: boolean
}

export interface GeneratedQuiz {
  questions: QuestionData[]
  stimuli: StimulusData[]
}

export async function generateQuiz(ai: AiService, params: GenerateParams): Promise<GeneratedQuiz> {
  if (params.mock) {
    return { questions: mockQuestions(params.style, params.count), stimuli: [MOCK_STIMULUS] }
  }

  const needed = compositionFor(params.count, params.style)
  const picked: QuestionData[] = []
  const stimuli = new Map<string, StimulusData>()

  for (const kind of ORDER) {
    if (needed[kind] === 0) {
      continue
    }
    const rows = await takeFromBank(params, kind, needed[kind])
    for (const row of rows) {
      picked.push(row.question)
      if (row.stimulus) {
        stimuli.set(row.stimulus.id, row.stimulus)
      }
    }
    needed[kind] -= rows.length
  }

  for (let round = 0; round < MAX_ROUNDS && total(needed) > 0; round++) {
    const batchKinds = takeBatch(needed)
    const saved = await generateBatch(ai, params, batchKinds)
    for (const item of saved) {
      picked.push(item.question)
      if (item.stimulus) {
        stimuli.set(item.stimulus.id, item.stimulus)
      }
      needed[item.question.type] = Math.max(0, needed[item.question.type] - 1)
    }
  }

  if (picked.length < params.count) {
    throw new AiUnavailableError()
  }
  return { questions: arrange(picked.slice(0, params.count)), stimuli: [...stimuli.values()] }
}

function total(counts: Record<QuestionKind, number>): number {
  return ORDER.reduce((sum, kind) => sum + counts[kind], 0)
}

// Up to five questions from the remaining counts, in form order.
function takeBatch(needed: Record<QuestionKind, number>): Record<QuestionKind, number> {
  const batch: Record<QuestionKind, number> = { PG: 0, CERITA: 0, ISIAN: 0, ESAI: 0 }
  let left = BATCH_SIZE
  for (const kind of ORDER) {
    const take = Math.min(needed[kind], left)
    batch[kind] = take
    left -= take
  }
  return batch
}

// Questions the user has not done yet, from the bank. Stimuli come with their questions.
async function takeFromBank(params: GenerateParams, kind: QuestionKind, amount: number) {
  const rows = await prisma.bankQuestion.findMany({
    where: {
      topicKey: params.sourceKey,
      // Subject is part of the key: questions from another subject were never checked for this one.
      subject: params.subject,
      level: params.level,
      type: kind,
      ...(params.userId ? { seen: { none: { userId: params.userId } } } : {}),
    },
    include: { stimulus: true },
    take: amount * 4,
  })
  return shuffle(rows)
    .slice(0, amount)
    .map((row) => ({
      question: {
        type: row.type,
        stimulusId: row.stimulusId,
        prompt: row.prompt,
        options: row.options as QuestionData['options'],
        answer: row.answer,
        acceptedAnswers: row.acceptedAnswers,
        rubric: row.rubric as RubricData[] | null,
        explanation: row.explanation,
        bankId: row.id,
      } satisfies QuestionData,
      stimulus: row.stimulus ? { id: row.stimulus.id, text: row.stimulus.text } : null,
    }))
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items]
  for (let index = copy.length - 1; index > 0; index--) {
    const other = Math.floor(Math.random() * (index + 1))
    ;[copy[index], copy[other]] = [copy[other], copy[index]]
  }
  return copy
}

// One AI batch: generate, check the keys (math and science), and save the kept questions to the bank.
async function generateBatch(ai: AiService, params: GenerateParams, kinds: Record<QuestionKind, number>) {
  const size = total(kinds)
  const composition = ORDER.filter((kind) => kinds[kind] > 0)
    .map((kind) => `${kind} ${kinds[kind]}`)
    .join(', ')
  const batch: KuisBatch = await ai.complete({
    task: 'KUIS_GENERATE',
    system: quizBatchPrompt({
      mapel: params.subject,
      topik: params.topicName,
      tingkat: params.level.toLowerCase(),
      jumlah: size,
      komposisi: composition,
    }),
    user: `Buat ${size} soal sekarang.`,
    schema: kuisBatchSchema(size),
    mock: () => '',
  })

  const keep = await keysThatHold(ai, params, batch)
  const stimulusText = new Map(batch.stimulus.map((item) => [item.id, item.teks]))
  const stimulusDb = new Map<string, StimulusData>()

  const saved: { question: QuestionData; stimulus: StimulusData | null }[] = []
  for (const index of keep) {
    const item = batch.soal[index]
    let stimulus: StimulusData | null = null
    if (item.stimulusId !== null) {
      stimulus = stimulusDb.get(item.stimulusId) ?? null
      if (!stimulus) {
        const created = await prisma.stimulus.create({
          data: { topicKey: params.sourceKey, level: params.level, text: stimulusText.get(item.stimulusId) ?? '' },
        })
        stimulus = { id: created.id, text: created.text }
        stimulusDb.set(item.stimulusId, stimulus)
      }
    }
    const rubric: RubricData[] | null =
      item.tipe === 'ESAI'
        ? (item.rubrik ?? []).map((rule) => ({ point: rule.poin, keywords: keywordsOf(rule.poin), weight: rule.bobot }))
        : null
    const question: QuestionData = {
      type: item.tipe,
      stimulusId: stimulus?.id ?? null,
      prompt: item.pertanyaan,
      options:
        item.tipe === 'PG' || item.tipe === 'CERITA'
          ? (item.pilihan ?? []).map((option) => ({ letter: option.huruf, text: option.teks }))
          : null,
      answer: item.tipe === 'PG' || item.tipe === 'CERITA' ? item.kunci : null,
      acceptedAnswers: item.tipe === 'ISIAN' && item.kunci ? [item.kunci] : [],
      rubric,
      explanation: item.pembahasan,
      bankId: null,
    }
    const row = await prisma.bankQuestion.create({
      data: {
        topicKey: params.sourceKey,
        level: params.level,
        subject: params.subject,
        type: question.type,
        stimulusId: stimulus?.id ?? null,
        prompt: question.prompt,
        options: question.options ? asJson(question.options) : undefined,
        answer: question.answer,
        acceptedAnswers: question.acceptedAnswers,
        rubric: rubric ? asJson(rubric) : undefined,
        explanation: question.explanation,
      },
    })
    question.bankId = row.id
    saved.push({ question, stimulus })
  }
  return saved
}

// Indexes of the questions that pass the key check. Essays are graded by the essay call, not checked here.
async function keysThatHold(ai: AiService, params: GenerateParams, batch: KuisBatch): Promise<number[]> {
  const everything = batch.soal.map((_, index) => index)
  if (!CHECKED_SUBJECTS.includes(params.subject)) {
    return everything
  }
  const checkable = batch.soal.map((item, index) => ({ item, index })).filter(({ item }) => item.tipe !== 'ESAI')
  if (checkable.length === 0) {
    return everything
  }
  const items = checkable.map(({ item, index }) => ({
    nomor: index + 1,
    stimulus: item.stimulusId ? (batch.stimulus.find((stimulus) => stimulus.id === item.stimulusId)?.teks ?? null) : null,
    tipe: item.tipe,
    pertanyaan: item.pertanyaan,
    pilihan: item.pilihan,
    kunciDariPembuat: item.kunci,
  }))
  const verdict: Verification = await ai.complete({
    task: 'VERIFIKASI_KUNCI',
    system: verifyKeyPrompt(),
    user: JSON.stringify(items),
    schema: verificationSchema,
    mock: () => JSON.stringify({ hasil: items.map((item) => ({ nomor: item.nomor, benar: true, jawabanBenar: item.kunciDariPembuat ?? '' })) }),
  })
  // "nomor" is the question's place in the batch, so the verdict maps back by that place.
  const passing = new Set(verdict.hasil.filter((result) => result.benar).map((result) => result.nomor))
  return everything.filter((index) => {
    const checked = checkable.some((entry) => entry.index === index)
    return !checked || passing.has(index + 1)
  })
}

// Questions of one stimulus stay together, then follow the form order.
function arrange(questions: QuestionData[]): QuestionData[] {
  return [...questions].sort(
    (a, b) => (a.stimulusId ?? '').localeCompare(b.stimulusId ?? '') || ORDER.indexOf(a.type) - ORDER.indexOf(b.type),
  )
}

// Stable ids for the items of one quiz run.
export function newItemId(): string {
  return randomUUID()
}

// Values stored in JSON columns. The shape is checked when they are written.
export function asJson(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue
}
