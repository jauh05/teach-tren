import { expect, test, type Page } from './fixtures'
import { expectNoHorizontalScroll, signOutFromMenu } from './helpers'

// Switches the app to guest mode through the avatar menu, the same way a signed-in user would.
async function signOut(page: Page) {
  await page.goto('/chat')
  await signOutFromMenu(page)
}

// Sends one message and waits until the answer has finished streaming.
async function sendMessage(page: Page, text: string) {
  const input = page.getByRole('textbox', { name: 'Tulis pertanyaan' })
  await input.fill(text)
  await input.press('Enter')
  await expect(page.getByRole('button', { name: 'Hentikan jawaban' })).toBeVisible()
  // After the second free action the composer locks, so either state means the answer is done.
  await expect(
    page.getByRole('button', { name: 'Kirim pesan' }).or(page.getByText('Untuk lanjut, daftar atau masuk dulu.')),
  ).toBeVisible({ timeout: 15_000 })
}

test.describe('Tamu', () => {
  test('sisa kuota tampil di header', async ({ page }, testInfo) => {
    await signOut(page)
    const header = page.locator('header:visible')
    if (testInfo.project.name === 'desktop') {
      await expect(header.getByText('Tamu · sisa 2 dari 2 aksi')).toBeVisible()
      await expect(header.getByRole('button', { name: 'Masuk', exact: true })).toBeVisible()
    } else {
      await expect(header.getByText('Tamu', { exact: true })).toBeVisible()
    }
    await expectNoHorizontalScroll(page)
  })

  test('dua aksi habis mengunci composer dan menampilkan ajakan daftar', async ({ page }) => {
    await signOut(page)
    await page.goto('/c/persamaan-linear')
    await sendMessage(page, 'Apa itu fotosintesis?')
    await sendMessage(page, 'Jelaskan lagi dengan singkat.')

    await expect(page.getByText('Untuk lanjut, daftar atau masuk dulu.')).toBeVisible()
    await expect(page.getByRole('textbox', { name: 'Tulis pertanyaan' })).toBeHidden()
    await expect(page.getByRole('region', { name: 'Lanjutkan belajar dengan akun' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Daftar dulu' }).first()).toBeVisible()
    await expectNoHorizontalScroll(page)
  })

  test('kuota habis memblokir kuis baru', async ({ page }) => {
    await signOut(page)
    await page.goto('/c/persamaan-linear')
    await sendMessage(page, 'Apa itu fotosintesis?')
    await sendMessage(page, 'Jelaskan lagi dengan singkat.')

    await page.goto('/kuis/persamaan-linear')
    await expect(page.getByRole('region', { name: 'Lanjutkan belajar dengan akun' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Pilihan A' })).toHaveCount(0)
  })

  test('riwayat tamu dibatasi dua percakapan di desktop', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'sidebar hanya tampil di layar 1024px ke atas')
    await signOut(page)
    const history = page.getByRole('navigation', { name: 'Riwayat percakapan' })
    await expect(history.getByText('Di perangkat ini')).toBeVisible()
    await expect(history.getByText('Maksimal 2 percakapan.')).toBeVisible()
    await expect(history.getByRole('link')).toHaveCount(2)
  })

  test('masuk dari halaman masuk kembali ke status akun', async ({ page, account }, testInfo) => {
    await signOut(page)
    await page.goto('/masuk')
    await page.getByLabel('Email').fill(account.email)
    await page.getByLabel('Kata sandi').fill(account.password)
    await page.getByRole('button', { name: 'Masuk', exact: true }).click()

    await expect(page).toHaveURL(/\/chat$/)
    const header = page.locator('header:visible')
    if (testInfo.project.name === 'desktop') {
      await expect(header.getByText('Rafi', { exact: true })).toBeVisible()
    } else {
      await expect(header.getByText('Masuk', { exact: true })).toBeVisible()
    }
  })

  test('redirect setelah masuk kembali ke halaman yang diminta', async ({ page, account }) => {
    await signOut(page)
    await page.goto('/masuk?redirect=/jadwal')
    await page.getByLabel('Email').fill(account.email)
    await page.getByLabel('Kata sandi').fill(account.password)
    await page.getByRole('button', { name: 'Masuk', exact: true }).click()
    await expect(page).toHaveURL(/\/jadwal$/)
  })

  test('formulir masuk menampilkan validasi', async ({ page }) => {
    await page.goto('/masuk')
    await page.getByRole('button', { name: 'Masuk', exact: true }).click()
    await expect(page.getByRole('alert').filter({ hasText: 'Masukkan email yang valid.' })).toBeVisible()
    await expect(page.getByRole('alert').filter({ hasText: 'Kata sandi minimal 8 karakter.' })).toBeVisible()
  })
})

test.describe('Impor riwayat tamu', () => {
  test.use({ asGuest: true })

  test('chat dari tamu ikut tersimpan ke akun saat masuk', async ({ page, request, account }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'daftar riwayat diuji di layar lebar')
    // The account exists on the server, but this page stays a guest until it signs in.
    const registered = await request.post('/api/auth/register', { data: { name: 'Rafi Arkan', email: account.email, password: account.password } })
    expect(registered.ok()).toBeTruthy()

    await page.goto('/chat')
    const input = page.getByRole('textbox', { name: 'Tulis pertanyaan' })
    await input.fill('Apa itu sel tumbuhan?')
    await input.press('Enter')
    await expect(page.getByRole('region', { name: 'Langkah berikutnya' })).toBeVisible({ timeout: 15_000 })

    // Move to the sign-in page inside the app, the way a guest does it.
    await page.getByRole('button', { name: 'Masuk', exact: true }).first().click()
    await page.getByLabel('Email').fill(account.email)
    await page.getByLabel('Kata sandi').fill(account.password)
    await page.getByRole('button', { name: 'Masuk', exact: true }).click()
    await expect(page).toHaveURL(/\/chat$/)

    const history = page.getByRole('navigation', { name: 'Riwayat percakapan' })
    await expect(history.getByRole('link', { name: 'Apa itu sel tumbuhan?' })).toBeVisible()
  })
})
