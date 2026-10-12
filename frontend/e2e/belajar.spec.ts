import { expect, test, type Page } from './fixtures'
import { expectNoHorizontalScroll } from './helpers'

// A new account has no learning plan, so it has no example topics either. Learning asks for the plan first.
test.describe('Rencana belajar', () => {
  test.use({ asGuest: true })

  // The page's own request context shares the session cookie with the browser page, so the page starts signed in.
  async function registerNewAccount(page: Page, account: { email: string; password: string }) {
    const registered = await page.context().request.post('/api/auth/register', {
      data: { name: 'Rani Putri', email: account.email, password: account.password },
    })
    expect(registered.ok()).toBeTruthy()
    await page.goto('/learning')
  }

  test('akun baru diminta memilih rencana sebelum Learning dibuka', async ({ page, account }, testInfo) => {
    await registerNewAccount(page, account)
    await expect(page).toHaveURL(/\/belajar\/mulai$/)
    if (testInfo.project.name !== 'desktop') {
      await expectNoHorizontalScroll(page)
    }

    await page.getByRole('radio', { name: 'SD' }).click()
    await page.getByRole('radio', { name: 'Kelas 4' }).click()
    await page.getByRole('button', { name: 'Lanjut' }).click()
    await page.getByRole('button', { name: 'Matematika' }).click()
    await page.getByRole('button', { name: 'Lanjut' }).click()
    await page.getByRole('button', { name: 'Pecahan sederhana' }).click()
    await page.getByRole('button', { name: 'Buat rencana' }).click()

    await expect(page).toHaveURL(/\/learning$/)
    // The chosen material is already on the canvas as a topic of the roadmap. Each topic is a button named after it.
    await expect(page.getByRole('button', { name: /^Pecahan sederhana/ })).toBeVisible()
  })

  test('materi boleh dilewati, lalu Learning tetap terbuka', async ({ page, account }) => {
    await registerNewAccount(page, account)
    await page.getByRole('radio', { name: 'SMP' }).click()
    await page.getByRole('radio', { name: 'Kelas 7' }).click()
    await page.getByRole('button', { name: 'Lanjut' }).click()
    await page.getByRole('button', { name: 'IPS' }).click()
    await page.getByRole('button', { name: 'Lanjut' }).click()
    await page.getByRole('button', { name: 'Lewati materi' }).click()

    await expect(page).toHaveURL(/\/learning$/)
  })

  test('rencana yang sudah ada langsung membuka Learning', async ({ page, account }) => {
    await registerNewAccount(page, account)
    await page.getByRole('radio', { name: 'SMA' }).click()
    await page.getByRole('radio', { name: 'Kelas 10' }).click()
    await page.getByRole('button', { name: 'Lanjut' }).click()
    await page.getByRole('button', { name: 'Fisika' }).click()
    await page.getByRole('button', { name: 'Lanjut' }).click()
    await page.getByRole('button', { name: 'Lewati materi' }).click()
    await expect(page).toHaveURL(/\/learning$/)

    await page.goto('/belajar/mulai')
    await expect(page).toHaveURL(/\/learning$/)
  })
})
