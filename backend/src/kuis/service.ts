import { z } from 'zod'
import { ai } from '../ai/index.js'
import { essayGradingPrompt } from '../ai/prompts.js'
import { essayGradingSchema, type EssayGrading } from '../ai/quizSchemas.js'
import type { Actor } from '../auth/actor.js'
import { config } from '../config/index.js'
import { prisma } from '../db.js'
import type { Prisma } from '../generated/prisma/client.js'
import { GUEST_ACTION_LIMIT } from '../chat/quota.js'
import { AppError } from '../http/errors.js'
import { logger } from '../logger.js'
import { generateQuiz, asJson } from './generate.js'
import { gradeEssayByKeywords, gradeFill } from './grading.js'
import { LEVELS, STYLES, type Level, type QuestionData, type StimulusData, type Style } from './types.js'

// Quiz runs (docs/api.md, CC-07 and CC-10). The answer keys never leave the server before the user answers.
const DAILY_QUIZ_LIMIT = 20
const ANSWER_MAX_CHARS = 1000

export const generateSchema = z.object({
  sumberId: z.string().trim().min(1).max(100),
  topicName: z.string().trim().max(60).optional(),
  // Subject for sources that are not a stored topic, such as guests' topics. Stored topics use their own subject.
  mapel: z.string().trim().max(40).optional(),
  count: z.union([z.literal(5), z.literal(10), z.literal(15), z.literal(20)]),
  level: z.enum(LEVELS),
  style: z.enum(STYLES),
})

export const answerSchema = z.object({
  answer: z.string().trim().min(1, 'Jawaban tidak boleh kosong.').max(ANSWER_MAX_CHARS, 'Jawaban maksimal 1000 karakter.'),
})

interface ItemRow {
  id: string
  position: number
  type: string
  stimulusId: string | null
  prompt: string
  options: unknown
  answer: string | null
  acceptedAnswers: string[]
  rubric: unknown
  explanation: string
  bankId: string | null
  userAnswer: string | null
  score: number | null
  feedback: string | null
  lowConfidence: boolean
}

interface RunRow {
  id: string
  userId: string | null
  guestId: string | null
  topicId: string | null
  topicName: string
  subject: string
  level: string
  style: string
  count: number
  retry: boolean
  status: string
  percent: number | null
  stimuli: unknown
  items: ItemRow[]
}

function ownerWhere(actor: Actor): Prisma.QuizRunWhereInput {
  return actor.kind === 'user' ? { userId: actor.userId } : { guestId: actor.guestId, userId: null }
}

async function loadRun(actor: Actor, quizId: string): Promise<RunRow> {
  const run = await prisma.quizRun.findFirst({
    where: { id: quizId, ...ownerWhere(actor) },
    include: { items: { orderBy: { position: 'asc' } } },
  })
  if (!run) {
    throw new AppError(404, 'Kuis tidak ditemukan.')
  }
  return run as unknown as RunRow
}

function stimuliOf(value: unknown): StimulusData[] {
  return Array.isArray(value) ? (value as StimulusData[]) : []
}

function optionsOf(value: unknown): { letter: string; text: string }[] | null {
  return Array.isArray(value) ? (value as { letter: string; text: string }[]) : null
}

// What the browser may see while the quiz is running: no keys, no explanations, no rubric.
function questionView(item: ItemRow) {
  return {
    id: item.id,
    position: item.position,
    type: item.type,
    stimulusId: item.stimulusId,
    prompt: item.prompt,
    options: optionsOf(item.options),
  }
}

function quizView(run: RunRow, items: ItemRow[]) {
  const used = new Set(items.map((item) => item.stimulusId))
  return {
    id: run.id,
    subject: run.subject,
    topicName: run.topicName,
    level: run.level,
    style: run.style,
    retry: run.retry,
    stimuli: stimuliOf(run.stimuli).filter((stimulus) => used.has(stimulus.id)),
    questions: items.map(questionView),
  }
}

function keyOf(item: ItemRow): string | null {
  if (item.type === 'ISIAN') {
    return item.acceptedAnswers[0] ?? null
  }
  if (item.type === 'ESAI') {
    return null
  }
  return item.answer
}

function resultItemView(item: ItemRow, signedIn: boolean) {
  return {
    ...questionView(item),
    jawaban: item.userAnswer,
    skor: item.score,
    kunci: keyOf(item),
    umpanBalik: item.feedback,
    lowConfidence: item.lowConfidence,
    // The explanation is for signed-in users only (docs/role.md 4.4).
    ...(signedIn ? { pembahasan: item.explanation } : {}),
  }
}

function resultView(run: RunRow, signedIn: boolean) {
  const correct = run.items.filter((item) => item.score === 100).length
  return {
    id: run.id,
    percent: run.percent,
    benar: correct,
    total: run.items.length,
    retry: run.retry,
    stimuli: stimuliOf(run.stimuli),
    items: run.items.map((item) => resultItemView(item, signedIn)),
  }
}

async function countTodayRuns(userId: string): Promise<number> {
  const startOfDay = new Date()
  startOfDay.setUTCHours(0, 0, 0, 0)
  return prisma.quizRun.count({ where: { userId, retry: false, createdAt: { gte: startOfDay } } })
}

export async function createQuiz(actor: Actor, body: unknown) {
  const input = generateSchema.parse(body)
  if (actor.kind === 'guest') {
    const usage = await prisma.guestUsage.findUnique({ where: { guestId: actor.guestId } })
    if ((usage?.actions ?? 0) >= GUEST_ACTION_LIMIT) {
      throw new AppError(429, 'Aksi AI gratis sudah habis. Daftar atau masuk untuk lanjut.', 'KUOTA_HABIS')
    }
  } else if ((await countTodayRuns(actor.userId)) >= DAILY_QUIZ_LIMIT) {
    throw new AppError(429, 'Batas 20 kuis per hari sudah tercapai. Coba lagi besok.', 'KUOTA_HABIS')
  }

  // Guests get five questions (docs/role.md 4.4).
  const count = actor.kind === 'guest' ? 5 : input.count
  const topic =
    actor.kind === 'user'
      ? await prisma.topic.findUnique({ where: { userId_id: { userId: actor.userId, id: input.sumberId } } })
      : null
  const topicName = topic?.name ?? input.topicName ?? 'Latihan umum'
  const subject = topic?.subject ?? input.mapel ?? 'Umum'

  const generated = await generateQuiz(ai, {
    sourceKey: input.sumberId,
    topicName,
    subject,
    level: input.level as Level,
    style: input.style as Style,
    count,
    userId: actor.kind === 'user' ? actor.userId : null,
    mock: config.AI_MODE === 'mock',
  })

  const run = await prisma.quizRun.create({
    data: {
      userId: actor.kind === 'user' ? actor.userId : null,
      guestId: actor.kind === 'guest' ? actor.guestId : null,
      topicId: topic?.id ?? null,
      topicName,
      subject,
      level: input.level,
      style: input.style,
      count,
      stimuli: asJson(generated.stimuli),
      items: {
        create: generated.questions.map((question, position) => toItemData(question, position)),
      },
    },
    include: { items: { orderBy: { position: 'asc' } } },
  })

  if (actor.kind === 'user') {
    const bankIds = generated.questions.map((question) => question.bankId).filter((id): id is string => id !== null)
    // Questions the user has done are skipped next time (docs/role.md CC-07, rule 1).
    if (bankIds.length > 0) {
      await prisma.bankSeen.createMany({ data: bankIds.map((bankId) => ({ userId: actor.userId, bankId })), skipDuplicates: true })
    }
  } else {
    await prisma.guestUsage.upsert({
      where: { guestId: actor.guestId },
      create: { guestId: actor.guestId, actions: 1 },
      update: { actions: { increment: 1 } },
    })
  }

  return { quiz: quizView(run as unknown as RunRow, run.items as unknown as ItemRow[]) }
}

function toItemData(question: QuestionData, position: number): Prisma.QuizItemCreateWithoutQuizInput {
  return {
    position,
    type: question.type,
    stimulusId: question.stimulusId,
    prompt: question.prompt,
    options: question.options ? asJson(question.options) : undefined,
    answer: question.answer,
    acceptedAnswers: question.acceptedAnswers,
    rubric: question.rubric ? asJson(question.rubric) : undefined,
    explanation: question.explanation,
    bankId: question.bankId,
  }
}

// Checks one answer. Choice and fill-in answers are graded at once. Essays wait for the submit step.
export async function answerQuestion(actor: Actor, quizId: string, itemId: string, body: unknown) {
  const { answer } = answerSchema.parse(body)
  const run = await loadRun(actor, quizId)
  if (run.status !== 'BERJALAN') {
    throw new AppError(409, 'Kuis sudah dikumpulkan.')
  }
  const item = run.items.find((entry) => entry.id === itemId)
  if (!item) {
    throw new AppError(404, 'Soal tidak ditemukan.')
  }
  if (item.userAnswer !== null) {
    throw new AppError(409, 'Soal ini sudah dijawab.')
  }

  if (item.type === 'ESAI') {
    await prisma.quizItem.update({ where: { id: item.id }, data: { userAnswer: answer } })
    return { tersimpan: true, skor: null, benar: null, kunci: null, pembahasan: null }
  }

  const score =
    item.type === 'ISIAN'
      ? gradeFill(answer, item.acceptedAnswers)
      : answer.toUpperCase() === (item.answer ?? '').toUpperCase()
        ? 100
        : 0
  await prisma.quizItem.update({ where: { id: item.id }, data: { userAnswer: answer, score } })
  return {
    tersimpan: true,
    skor: score,
    benar: score === 100,
    kunci: keyOf(item),
    ...(actor.kind === 'user' ? { pembahasan: item.explanation } : {}),
  }
}

// Ends the run: essays are graded in one AI call, unanswered questions count as zero, and the score is saved for signed-in users.
export async function submitQuiz(actor: Actor, quizId: string) {
  const run = await loadRun(actor, quizId)
  if (run.status === 'SELESAI') {
    return resultView(run, actor.kind === 'user')
  }

  const essays = run.items.filter((item) => item.type === 'ESAI' && item.userAnswer !== null)
  const graded = await gradeEssays(essays)
  const updates = run.items.map((item) => {
    if (item.type === 'ESAI') {
      const result = graded.get(item.id)
      return { id: item.id, score: result?.score ?? 0, feedback: result?.feedback ?? null, lowConfidence: result?.lowConfidence ?? false }
    }
    return { id: item.id, score: item.score ?? 0, feedback: null, lowConfidence: false }
  })
  const percent = updates.length === 0 ? 0 : Math.round(updates.reduce((sum, item) => sum + item.score, 0) / updates.length)

  await prisma.$transaction([
    ...updates.map((update) =>
      prisma.quizItem.update({
        where: { id: update.id },
        data: { score: update.score, feedback: update.feedback, lowConfidence: update.lowConfidence },
      }),
    ),
    prisma.quizRun.update({ where: { id: run.id }, data: { status: 'SELESAI', percent, finishedAt: new Date() } }),
  ])

  // Only the first full run of a topic changes its score. Retry runs do not (docs/role.md CC-07).
  if (actor.kind === 'user' && !run.retry && run.topicId) {
    await prisma.$transaction([
      prisma.quizAttempt.create({ data: { userId: actor.userId, topicId: run.topicId, percent } }),
      prisma.topic.update({ where: { userId_id: { userId: actor.userId, id: run.topicId } }, data: { lastScore: percent } }),
    ])
  }

  const finished = await loadRun(actor, quizId)
  return resultView(finished, actor.kind === 'user')
}

// Grades the answered essays. The AI grades them in one call. If the AI is not available, keywords grade them and mark them for review.
async function gradeEssays(essays: ItemRow[]): Promise<Map<string, { score: number; feedback: string | null; lowConfidence: boolean }>> {
  const result = new Map<string, { score: number; feedback: string | null; lowConfidence: boolean }>()
  if (essays.length === 0) {
    return result
  }
  const payload = essays.map((item) => ({
    id: item.id,
    pertanyaan: item.prompt,
    rubrik: ((item.rubric as { point: string; weight: number }[] | null) ?? []).map((rule) => ({ poin: rule.point, bobot: rule.weight })),
    jawaban: item.userAnswer ?? '',
  }))
  // Keyword grading as the rule of the first version. "lowConfidence" follows the answer itself.
  const keywordGrade = (item: ItemRow) => {
    const rubric = (item.rubric as { point: string; keywords: string[]; weight: number }[] | null) ?? []
    return gradeEssayByKeywords(item.userAnswer ?? '', rubric)
  }
  // Used when the AI grader cannot be reached. Every such answer is marked for review.
  const unavailableGrade = (item: ItemRow) => ({ score: keywordGrade(item).score, feedback: null, lowConfidence: true })
  try {
    const grading: EssayGrading = await ai.complete({
      task: 'NILAI_ESAI',
      system: essayGradingPrompt(JSON.stringify(payload)),
      user: 'Nilai semua esai di atas sekarang.',
      schema: essayGradingSchema,
      mock: () =>
        JSON.stringify({
          hasil: essays.map((item) => {
            const graded = keywordGrade(item)
            return { id: item.id, skor: graded.score, umpanBalik: 'Penilaian contoh untuk mode mock.', keyakinan: graded.lowConfidence ? 'RENDAH' : 'TINGGI' }
          }),
        }),
    })
    const known = new Set(essays.map((item) => item.id))
    for (const entry of grading.hasil) {
      if (known.has(entry.id)) {
        result.set(entry.id, { score: entry.skor, feedback: entry.umpanBalik, lowConfidence: entry.keyakinan === 'RENDAH' })
      }
    }
  } catch (error) {
    logger.warn({ reason: error instanceof Error ? error.name : 'kesalahan' }, 'Penilaian esai AI tidak tersedia, memakai kata kunci')
  }
  for (const item of essays) {
    if (!result.has(item.id)) {
      result.set(item.id, unavailableGrade(item))
    }
  }
  return result
}

// A new run with only the questions answered wrong. It does not change the saved score.
export async function retryWrong(actor: Actor, quizId: string) {
  const run = await loadRun(actor, quizId)
  if (run.status !== 'SELESAI') {
    throw new AppError(409, 'Kumpulkan kuis dulu sebelum mengulang soal salah.')
  }
  const wrong = run.items.filter((item) => item.score === null || item.score < 100)
  if (wrong.length === 0) {
    throw new AppError(409, 'Tidak ada soal yang salah.')
  }
  const usedStimuli = new Set(wrong.map((item) => item.stimulusId))
  const stimuli = stimuliOf(run.stimuli).filter((stimulus) => usedStimuli.has(stimulus.id))
  const created = await prisma.quizRun.create({
    data: {
      userId: run.userId,
      guestId: run.guestId,
      topicId: run.topicId,
      topicName: run.topicName,
      subject: run.subject,
      level: run.level,
      style: run.style,
      count: wrong.length,
      retry: true,
      stimuli: asJson(stimuli),
      items: {
        create: wrong.map((item, position) => ({
          position,
          type: item.type as QuestionData['type'],
          stimulusId: item.stimulusId,
          prompt: item.prompt,
          options: item.options === null ? undefined : asJson(item.options),
          answer: item.answer,
          acceptedAnswers: item.acceptedAnswers,
          rubric: item.rubric === null ? undefined : asJson(item.rubric),
          explanation: item.explanation,
          bankId: item.bankId,
        })),
      },
    },
    include: { items: { orderBy: { position: 'asc' } } },
  })
  return { quiz: quizView(created as unknown as RunRow, created.items as unknown as ItemRow[]) }
}
