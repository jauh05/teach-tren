import { expect, test, type Page } from '@playwright/test'
import { visibleOnly } from './helpers'

// The history list is the desktop sidebar, or the drawer on phones.
async function history(page: Page, isDesktop: boolean) {
  if (isDesktop) {
    return page.getByRole('navigation', { name: 'Riwayat percakapan' })
  }
  await visibleOnly(page.getByRole('button', { name: 'Buka riwayat' })).click()
  return page.getByRole('dialog', { name: 'Riwayat percakapan' })
}

test.describe('Riwayat chat', () => {
  test('chat baru dari beranda tersimpan dan muncul di riwayat', async ({ page }, testInfo) => {
    await page.goto('/chat')
    await page.getByRole('button', { name: 'Apa beda sel hewan dan sel tumbuhan?' }).click()
    await expect(page.getByRole('region', { name: 'Langkah berikutnya' })).toBeVisible({ timeout: 15_000 })
    await expect(page).not.toHaveURL(/\/c\/baru$/)

    const list = await history(page, testInfo.project.name === 'desktop')
    await expect(list.getByRole('link', { name: 'Apa beda sel hewan dan sel tumbuhan?' })).toBeVisible()
  })

  test('cari judul menyaring riwayat', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'pencarian diuji di layar lebar')
    await page.goto('/chat')
    const list = await history(page, true)
    await page.getByRole('searchbox', { name: 'Cari percakapan' }).fill('proklamasi')
    await expect(list.getByRole('link', { name: 'Proklamasi kemerdekaan' })).toBeVisible()
    await expect(list.getByRole('link', { name: 'Hukum Newton' })).toHaveCount(0)
  })

  test('ganti nama dan hapus percakapan', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'aksi riwayat diuji di layar lebar')
    await page.goto('/chat')
    const list = await history(page, true)

    await list.getByRole('button', { name: 'Ganti nama Hukum Newton' }).click()
    const input = list.getByRole('textbox', { name: 'Judul percakapan' })
    await input.fill('Hukum Newton kedua')
    await input.press('Enter')
    await expect(list.getByRole('link', { name: 'Hukum Newton kedua' })).toBeVisible()

    await list.getByRole('button', { name: 'Hapus Hukum Newton kedua' }).click()
    await list.getByRole('button', { name: 'Hapus', exact: true }).click()
    await expect(list.getByRole('link', { name: 'Hukum Newton kedua' })).toHaveCount(0)
  })
})
