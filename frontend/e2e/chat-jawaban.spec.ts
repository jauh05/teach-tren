import { expect, test } from '@playwright/test'
import { expectNoHorizontalScroll } from './helpers'

const LONG_TIMEOUT = 15_000

test.describe('Chat jawaban', () => {
  test('menampilkan rumus KaTeX dan kartu langkah berikutnya', async ({ page }) => {
    await page.goto('/c/persamaan-linear')
    await expect(page.getByText('Bagaimana cara menyelesaikan persamaan')).toBeVisible()
    await expect(page.locator('.katex').first()).toBeVisible()
    await expect(page.getByRole('region', { name: 'Langkah berikutnya' })).toBeVisible()
    await expectNoHorizontalScroll(page)
  })

  test('kartu langkah berikutnya membuka kuis dari topik ini', async ({ page }) => {
    await page.goto('/c/persamaan-linear')
    const card = page.getByRole('region', { name: 'Langkah berikutnya' })
    await card.getByRole('listitem').filter({ hasText: 'Kerjakan kuis' }).getByRole('button', { name: 'Mulai' }).click()
    await expect(page).toHaveURL(/\/kuis\/persamaan-linear$/)
  })

  test('pertanyaan baru tampil bertahap sampai selesai', async ({ page }) => {
    await page.goto('/c/sel-tumbuhan')
    const input = page.getByRole('textbox', { name: 'Tulis pertanyaan' })
    await input.fill('Jelaskan fungsi mitokondria.')
    await input.press('Enter')

    await expect(page.getByText('Jelaskan fungsi mitokondria.')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Hentikan jawaban' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Hentikan jawaban' })).toBeHidden({ timeout: LONG_TIMEOUT })
    await expect(page.getByRole('region', { name: 'Langkah berikutnya' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Kirim pesan' })).toBeVisible()
  })

  test('tombol berhenti menghentikan jawaban', async ({ page }) => {
    await page.goto('/c/sel-tumbuhan')
    const input = page.getByRole('textbox', { name: 'Tulis pertanyaan' })
    await input.fill('Jelaskan proses osmosis secara lengkap.')
    await input.press('Enter')

    await page.getByRole('button', { name: 'Hentikan jawaban' }).click()
    await expect(page.getByText('Jawaban dihentikan.')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Kirim pesan' })).toBeVisible()
    await expect(page.getByRole('region', { name: 'Langkah berikutnya' })).toBeHidden()
  })

  test('pertanyaan dari beranda dikirim ke percakapan baru', async ({ page }) => {
    await page.goto('/chat')
    await page.getByRole('button', { name: 'Apa beda sel hewan dan sel tumbuhan?' }).click()
    await expect(page).toHaveURL(/\/c\/baru$/)
    await expect(page.getByText('Apa beda sel hewan dan sel tumbuhan?')).toBeVisible()
    await expect(page.getByRole('region', { name: 'Langkah berikutnya' })).toBeVisible({ timeout: LONG_TIMEOUT })
  })

  test('ulangi membuat jawaban ulang tanpa menggandakan teks', async ({ page }) => {
    await page.goto('/c/sel-tumbuhan')
    await expect(page.getByRole('region', { name: 'Langkah berikutnya' })).toBeVisible()
    await page.getByRole('button', { name: 'Ulangi' }).click()
    await expect(page.getByRole('region', { name: 'Langkah berikutnya' })).toBeHidden()
    await expect(page.getByRole('region', { name: 'Langkah berikutnya' })).toBeVisible({ timeout: LONG_TIMEOUT })
    // The regenerated answer replaces the old text instead of appending to it.
    await expect(page.getByText('Ini jawaban contoh dari tampilan frontend.')).toHaveCount(1)
    await expect(page.getByText('Sel tumbuhan memiliki dinding sel')).toHaveCount(0)
  })

  test('percakapan yang tidak ada menampilkan pesan tidak ditemukan', async ({ page }) => {
    await page.goto('/c/tidak-ada')
    await expect(page.getByRole('heading', { name: 'Percakapan tidak ditemukan' })).toBeVisible()
  })
})
