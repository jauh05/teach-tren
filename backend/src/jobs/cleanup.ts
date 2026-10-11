import { prisma } from '../db.js'
import { logger } from '../logger.js'

// Retention rules (docs/role.md 2.4 and CC-10). Each one is a deleteMany with a cutoff date.
const GUEST_INACTIVE_DAYS = 30
const GUEST_QUIZ_DAYS = 7
const DELETION_GRACE_DAYS = 30
const DAY_MS = 24 * 60 * 60 * 1000

export interface CleanupResult {
  guestUsage: number
  guestQuizzes: number
  accounts: number
}

export async function runCleanup(now: Date = new Date()): Promise<CleanupResult> {
  const guestUsage = await prisma.guestUsage.deleteMany({
    where: { updatedAt: { lt: new Date(now.getTime() - GUEST_INACTIVE_DAYS * DAY_MS) } },
  })
  const guestQuizzes = await prisma.quizRun.deleteMany({
    where: { userId: null, createdAt: { lt: new Date(now.getTime() - GUEST_QUIZ_DAYS * DAY_MS) } },
  })

  // Accounts whose deletion was requested long enough ago. Quiz runs have no foreign key, so they are removed first.
  const due = await prisma.user.findMany({
    where: { deletionScheduledAt: { lt: new Date(now.getTime() - DELETION_GRACE_DAYS * DAY_MS) } },
    select: { id: true },
  })
  const ids = due.map((user) => user.id)
  if (ids.length > 0) {
    await prisma.quizRun.deleteMany({ where: { userId: { in: ids } } })
  }
  const accounts = await prisma.user.deleteMany({ where: { id: { in: ids } } })

  return { guestUsage: guestUsage.count, guestQuizzes: guestQuizzes.count, accounts: accounts.count }
}

// Runs the cleanup once a day while the server is up.
export function startCleanupJob(): void {
  const timer = setInterval(() => {
    runCleanup().then(
      (result) => logger.info(result, 'Pembersihan data selesai'),
      (error: unknown) => logger.error({ err: error }, 'Pembersihan data gagal'),
    )
  }, DAY_MS)
  timer.unref()
}
