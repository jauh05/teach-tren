import { expect, test } from '@playwright/test'

test('halaman awal terbuka dan menampilkan judul', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle('Teach Tren')
  await expect(page.getByRole('heading', { name: 'Teach Tren' })).toBeVisible()
})

test('tidak ada scroll horizontal', async ({ page }) => {
  await page.goto('/')
  const overflows = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)
  expect(overflows).toBe(false)
})
