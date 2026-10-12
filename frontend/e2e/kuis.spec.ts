import { expect, test, type Page } from './fixtures'
import { expectNoHorizontalScroll, signOutFromMenu } from './helpers'

// Correct letters for the five mock questions (src/api/quizzes.ts).
const CORRECT = ['B', 'A', 'B', 'A', 'C']

async function answer(page: Page, letter: string) {
  await page.getByRole('button', { name: `Pilihan ${letter}` }).click()
}

async function nextQuestion(page: Page) {
  await page.getByRole('button', { name: 'Soal berikutnya' }).click()
}

test.describe('Kuis', () => {
  test('soal pertama tampil satu per layar dengan pilihan A sampai D', async ({ page }) => {
    await page.goto('/kuis/persamaan-linear')
    await expect(page.getByText('Soal 1 dari 5')).toBeVisible()
    for (const letter of ['A', 'B', 'C', 'D']) {
      await expect(page.getByRole('button', { name: `Pilihan ${letter}` })).toBeVisible()
    }
    await expect(page.getByRole('button', { name: 'Soal berikutnya' })).toBeDisabled()
    await expectNoHorizontalScroll(page)
  })

  test('jawaban salah menandai pilihan dan menampilkan pembahasan untuk pengguna masuk', async ({ page }) => {
    await page.goto('/kuis/persamaan-linear')
    await answer(page, 'A')

    await expect(page.getByText('Pilihanmu salah')).toBeVisible()
    await expect(page.getByText('Benar', { exact: true })).toBeVisible()
    await expect(page.getByRole('region', { name: 'Pembahasan' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Pilihan A' })).toBeDisabled()
  })

  test('teks bacaan bisa dilipat dan rumus tampil dengan KaTeX', async ({ page }) => {
    await page.goto('/kuis/persamaan-linear')
    for (let index = 0; index < 3; index++) {
      await answer(page, CORRECT[index])
      await nextQuestion(page)
    }

    await expect(page.getByText('Soal 4 dari 5')).toBeVisible()
    await expect(page.getByText('Teks bacaan')).toBeVisible()
    await expect(page.locator('.katex').first()).toBeVisible()

    await page.getByText('Teks bacaan').click()
    await expect(page.getByText('Toko Sinar Ilmu menjual buku tulis')).toBeHidden()
    await expectNoHorizontalScroll(page)
  })

  test('tandai ragu mengubah label tombol', async ({ page }) => {
    await page.goto('/kuis/persamaan-linear')
    await page.getByRole('button', { name: 'Tandai ragu' }).click()
    await expect(page.getByRole('button', { name: 'Ditandai ragu' })).toBeVisible()
  })

  test('menyelesaikan kuis memperbarui status neuron di Learning', async ({ page }) => {
    await page.goto('/kuis/persamaan-linear')
    for (let index = 0; index < CORRECT.length; index++) {
      await answer(page, CORRECT[index])
      await page.getByRole('button', { name: index < CORRECT.length - 1 ? 'Soal berikutnya' : 'Lihat hasil' }).click()
    }

    await expect(page.getByText('Skor kuis')).toBeVisible()
    await expect(page.getByText('100%')).toBeVisible()
    await page.getByRole('button', { name: 'Kembali ke Learning' }).click()

    await expect(page).toHaveURL(/\/learning$/)
    const topic = page.locator('[data-topic-id="persamaan-linear"][role="button"]')
    await expect(topic).toHaveAttribute('aria-label', /Sudah dikuasai/)
  })

  test('tamu tidak melihat pembahasan', async ({ page }) => {
    await page.goto('/chat')
    await signOutFromMenu(page)

    await page.goto('/kuis/persamaan-linear')
    await answer(page, 'A')
    await expect(page.getByRole('region', { name: 'Pembahasan terkunci' })).toBeVisible()
    await expect(page.getByRole('region', { name: 'Pembahasan', exact: true })).toHaveCount(0)
    await expectNoHorizontalScroll(page)
  })

  test('kuis yang gagal dibuat menampilkan pesan server dan bisa dicoba lagi', async ({ page }) => {
    let requests = 0
    await page.route('**/api/kuis/generate', async (route) => {
      requests += 1
      if (requests === 1) {
        await route.fulfill({ status: 503, json: { pesan: 'Layanan belajar sedang sibuk. Coba lagi beberapa saat.', kode: 'AI_TIDAK_TERSEDIA' } })
        return
      }
      await route.continue()
    })
    await page.goto('/kuis/persamaan-linear')
    await expect(page.getByRole('alert')).toHaveText('Layanan belajar sedang sibuk. Coba lagi beberapa saat.')
    // The failed request is not repeated on its own, so the message stays until the user asks again.
    await page.waitForTimeout(1500)
    expect(requests).toBe(1)

    await page.getByRole('button', { name: 'Coba lagi' }).click()
    await expect(page.getByText('Soal 1 dari 5')).toBeVisible()
    expect(requests).toBe(2)
  })
})
