import { expect, test } from './fixtures'
import { expectNoHorizontalScroll } from './helpers'

test.describe('Tentang', () => {
  test('panduan tampil dan bisa dibuka tanpa masuk', async ({ page }) => {
    await page.goto('/tentang')
    await expect(page.getByRole('heading', { name: 'Tentang Teach Tren', level: 1 })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Mulai cepat' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Batas penggunaan' })).toBeVisible()
    await expectNoHorizontalScroll(page)
  })

  test('tombol mulai chat membuka chat', async ({ page }) => {
    await page.goto('/tentang')
    await page.getByRole('button', { name: 'Mulai chat' }).click()
    await expect(page).toHaveURL(/\/chat$/)
  })
})
