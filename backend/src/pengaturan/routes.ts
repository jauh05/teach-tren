import { Router } from 'express'
import { z } from 'zod'
import { requireUser, userIdOf } from '../auth/requireUser.js'
import { prisma } from '../db.js'
import { LEVELS, STYLES } from '../kuis/types.js'

// Study preferences (docs/role.md 4.7). Stored on the account, so they follow the user to other devices.
export const pengaturanRouter = Router()
pengaturanRouter.use(requireUser)

const preferencesSchema = z.object({
  questionCount: z.union([z.literal(5), z.literal(10), z.literal(15), z.literal(20)]),
  level: z.enum(LEVELS),
  quizStyle: z.enum(STYLES),
  quickChoiceAfterMaterial: z.boolean(),
  theme: z.enum(['light', 'system']),
  reminderEnabled: z.boolean(),
  reminderTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Jam pengingat harus berformat HH:mm.'),
})

interface PreferenceRow {
  questionCount: number
  level: string
  quizStyle: string
  quickChoiceAfterMaterial: boolean
  theme: string
  reminderEnabled: boolean
  reminderTime: string
}

function toPreferences(row: PreferenceRow) {
  return {
    questionCount: row.questionCount,
    level: row.level,
    quizStyle: row.quizStyle,
    quickChoiceAfterMaterial: row.quickChoiceAfterMaterial,
    theme: row.theme,
    reminderEnabled: row.reminderEnabled,
    reminderTime: row.reminderTime,
  }
}

pengaturanRouter.get('/preferensi', async (req, res) => {
  const row = await prisma.userPreference.findUnique({ where: { userId: userIdOf(req) } })
  // Without a saved row, the defaults of the schema apply.
  res.json({ preferensi: toPreferences(row ?? (await prisma.userPreference.create({ data: { userId: userIdOf(req) } }))) })
})

pengaturanRouter.put('/preferensi', async (req, res) => {
  const input = preferencesSchema.parse(req.body)
  const userId = userIdOf(req)
  const row = await prisma.userPreference.upsert({
    where: { userId },
    create: { userId, ...input },
    update: input,
  })
  res.json({ preferensi: toPreferences(row) })
})
