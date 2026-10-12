import { Router } from 'express'
import { Prisma, type LearningPlan } from '../generated/prisma/client.js'
import { requireUser, userIdOf } from '../auth/requireUser.js'
import { prisma } from '../db.js'
import { AppError } from '../http/errors.js'
import { CURRICULUM } from '../kurikulum/catalog.js'
import { planSchema } from './plan.js'
import { CENTER } from '../topics/placement.js'
import { buildRoadmap, LANE_GAP } from './roadmap.js'

// The curriculum choices. Public, so the wizard can load them before sign-in.
export const kurikulumRouter = Router()

kurikulumRouter.get('/', (_req, res) => {
  res.json({ jenjang: CURRICULUM })
})

// The learning plan of the signed-in account (one per account).
export const rencanaRouter = Router()
rencanaRouter.use(requireUser)

rencanaRouter.get('/', async (req, res) => {
  const plan = await prisma.learningPlan.findUnique({ where: { userId: userIdOf(req) } })
  res.json({ rencana: plan ? toPlanView(plan) : null })
})

// Saves the plan and makes the roadmap: one topic per chosen material, in one lane per subject.
rencanaRouter.post('/', async (req, res) => {
  const input = planSchema.parse(req.body ?? {})
  const userId = userIdOf(req)

  const existing = await prisma.learningPlan.findUnique({ where: { userId } })
  if (existing) {
    throw new AppError(409, 'Rencana belajar sudah dibuat.', 'SUDAH_ADA')
  }

  // On an empty canvas the first lane starts at the canvas center and the rest go down, so the top controls stay clear.
  // Otherwise the lanes start below the account's topics.
  const placed = await prisma.topic.findMany({ where: { userId }, select: { name: true, y: true } })
  const startY = placed.length > 0 ? Math.max(...placed.map((topic) => topic.y)) + LANE_GAP : CENTER.y
  const roadmap = buildRoadmap({
    subjects: input.subjects,
    topics: input.topics,
    existingNames: placed.map((topic) => topic.name),
    startY,
    centerX: CENTER.x,
    newId: () => crypto.randomUUID(),
  })

  let plan: LearningPlan
  try {
    plan = await prisma.$transaction(async (tx) => {
      const created = await tx.learningPlan.create({
        data: { userId, levelId: input.levelId, grade: input.grade, subjects: input.subjects },
      })
      if (roadmap.topics.length > 0) {
        await tx.topic.createMany({
          data: roadmap.topics.map((topic) => ({ userId, id: topic.id, name: topic.name, subject: topic.subject, x: topic.x, y: topic.y })),
        })
      }
      if (roadmap.links.length > 0) {
        await tx.topicLink.createMany({
          data: roadmap.links.map((link) => ({ userId, sourceId: link.sourceId, targetId: link.targetId, suggested: false })),
        })
      }
      return created
    })
  } catch (error) {
    // Two saves at the same time: the second one finds the plan the first one made.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new AppError(409, 'Rencana belajar sudah dibuat.', 'SUDAH_ADA')
    }
    throw error
  }

  res.status(201).json({ rencana: toPlanView(plan), bulat: roadmap.topics.length })
})

function toPlanView(plan: LearningPlan) {
  return {
    levelId: plan.levelId,
    grade: plan.grade,
    subjects: plan.subjects,
    dibuatPada: plan.createdAt.toISOString(),
  }
}
