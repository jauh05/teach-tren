import { expect, test } from './fixtures'
import { expectNoHorizontalScroll } from './helpers'

// The welcome screen is the front door. A guest can start from it, and a signed-in account never sees it.
test.describe('Selamat datang', () => {
  test.use({ asGuest: true })

  test('tamu melihat selamat datang, menjelajah tur, lalu masuk ke chat sebagai tamu', async ({ page }, testInfo) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'Belajar lebih terarah, satu neuron satu langkah' })).toBeVisible()
    if (testInfo.project.name !== 'desktop') {
      await expectNoHorizontalScroll(page)
    }

    await page.getByRole('button', { name: 'Mulai' }).click()
    await expect(page).toHaveURL(/\/tur$/)
    // Four slides: three times "Lanjut", then the guest button on the last slide.
    await page.getByRole('button', { name: 'Lanjut' }).click()
    await page.getByRole('button', { name: 'Lanjut' }).click()
    await page.getByRole('button', { name: 'Lanjut' }).click()
    await page.getByRole('button', { name: 'Lanjut sebagai tamu' }).click()

    await expect(page).toHaveURL(/\/chat$/)
  })

  test('tamu bisa langsung lanjut sebagai tamu dari selamat datang', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Lanjut sebagai tamu' }).click()
    await expect(page).toHaveURL(/\/chat$/)
  })

  test('lewati tur langsung ke halaman masuk', async ({ page }) => {
    await page.goto('/tur')
    await page.getByRole('button', { name: 'Lewati' }).click()
    await expect(page).toHaveURL(/\/masuk$/)
  })

  test('akun yang sudah masuk tidak melihat selamat datang', async ({ page, account }) => {
    const registered = await page.context().request.post('/api/auth/register', {
      data: { name: 'Rani Putri', email: account.email, password: account.password },
    })
    expect(registered.ok()).toBeTruthy()

    await page.goto('/')
    // The account has no learning plan yet, so it goes to the wizard instead of the welcome screen.
    await expect(page).toHaveURL(/\/belajar\/mulai$/)
  })

  test('halaman masuk menampilkan Google, Facebook, dan TikTok sebagai tombol segera hadir', async ({ page }) => {
    await page.goto('/masuk')
    for (const name of ['Google', 'Facebook', 'TikTok']) {
      await expect(page.getByRole('button', { name: `Masuk dengan ${name}, segera hadir` })).toBeDisabled()
    }
  })
})

