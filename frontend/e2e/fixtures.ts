import { test as base, expect, type BrowserContext } from '@playwright/test'
import { createE2eDatabase } from '../../backend/test/e2eDb'
import { seedExampleGraph } from '../../backend/test/exampleGraph'
import { DEMO_CONVERSATIONS } from './exampleData'

// Every test gets its own account, so tests cannot change each other's history.
// Pass `test.use({ asGuest: true })` to start as a guest instead.
export { expect }
export type { Locator, Page } from '@playwright/test'

export const E2E_PASSWORD = 'kata-sandi-e2e-123'

export interface TestAccount {
  email: string
  password: string
}

interface Fixtures {
  asGuest: boolean
  account: TestAccount
}

export const test = base.extend<Fixtures>({
  asGuest: [false, { option: true }],
  // The account is registered only when the test starts signed in. Login tests use the same credentials.
  // The dependency on asGuest is only there so the fixture can take an object pattern.
  account: async ({ asGuest: _asGuest }, runTest) => {
    await runTest({ email: `uji-${crypto.randomUUID()}@contoh.id`, password: E2E_PASSWORD })
  },
  page: async ({ page, asGuest, account }, runTest) => {
    if (!asGuest) {
      await createSignedInAccount(page.context(), account)
    }
    await runTest(page)
  },
})

// Registers a fresh account in this browser context, then gives it the example topics and chats.
// The session cookie is stored by the context, so the page starts signed in.
async function createSignedInAccount(context: BrowserContext, account: TestAccount): Promise<void> {
  const registered = await context.request.post('/api/auth/register', {
    data: { name: 'Rafi Arkan', email: account.email, password: account.password },
  })
  if (!registered.ok()) {
    throw new Error(`Gagal membuat akun uji: ${registered.status()}`)
  }
  await seedExampleTopics(account.email)
  for (const conversation of DEMO_CONVERSATIONS) {
    const saved = await context.request.put(`/api/conversations/${conversation.id}`, {
      data: {
        title: conversation.title,
        messages: conversation.messages.map((message) => ({ ...message, status: 'done' })),
      },
    })
    if (!saved.ok()) {
      throw new Error(`Gagal menyiapkan percakapan uji: ${saved.status()}`)
    }
  }
}

// The example topics are written to the test database, so the signed-in account has the same topic ids as before.
// The starter topic that registration creates is replaced by them. Only the test database is used.
async function seedExampleTopics(email: string): Promise<void> {
  const url = process.env.TEST_DATABASE_URL ?? ''
  const db = createE2eDatabase(url)
  try {
    const user = await db.user.findUniqueOrThrow({ where: { email } })
    await seedExampleGraph(db, user.id)
  } finally {
    await db.$disconnect()
  }
}
