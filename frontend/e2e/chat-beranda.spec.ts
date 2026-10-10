import { expect, test } from '@playwright/test'
import { expectNoHorizontalScroll, visibleOnly } from './helpers'

test.describe('Chat beranda', () => {
  test('menampilkan sapaan, kolom tulis, dan saran', async ({ page }) => {
    await page.goto('/chat')
    await expect(page.getByRole('heading', { name: 'Mau belajar apa hari ini?' })).toBeVisible()
    await expect(page.getByRole('textbox', { name: 'Tulis pertanyaan' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Jelaskan persamaan linear dengan contoh' })).toBeVisible()
    await expect(page.getByText('Riwayat Anda tersimpan di akun.')).toBeVisible()
    await expectNoHorizontalScroll(page)
  })

  test('Enter mengirim pertanyaan dan membuka percakapan baru', async ({ page }) => {
    await page.goto('/chat')
    const input = page.getByRole('textbox', { name: 'Tulis pertanyaan' })
    await input.fill('Apa itu fotosintesis?')
    await input.press('Enter')
    await expect(page).toHaveURL(/\/c\/baru$/)
  })

  test('Shift+Enter menambah baris tanpa mengirim', async ({ page }) => {
    await page.goto('/chat')
    const input = page.getByRole('textbox', { name: 'Tulis pertanyaan' })
    await input.fill('Baris pertama')
    await input.press('Shift+Enter')
    await expect(page).toHaveURL(/\/chat$/)
    await expect(input).toHaveValue('Baris pertama\n')
  })

  test('saran membuka percakapan baru', async ({ page }) => {
    await page.goto('/chat')
    await page.getByRole('button', { name: 'Ringkas fotosintesis dalam 5 poin' }).click()
    await expect(page).toHaveURL(/\/c\/baru$/)
  })

  test('sidebar riwayat tampil di desktop dan bisa diciutkan', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'sidebar hanya tampil di layar 1024px ke atas')
    await page.goto('/chat')
    const history = page.getByRole('navigation', { name: 'Riwayat percakapan' })
    await expect(history.getByRole('link', { name: 'Persamaan linear' })).toBeVisible()
    await expect(history.getByText('Hari ini')).toBeVisible()
    await expect(history.getByText('Kemarin')).toBeVisible()

    await page.getByRole('button', { name: 'Ciutkan riwayat' }).click()
    await expect(history).toBeHidden()
    await page.getByRole('button', { name: 'Buka riwayat' }).click()
    await expect(history).toBeVisible()
  })

  test('drawer riwayat di mobile tertutup dengan Escape', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile', 'drawer hanya dipakai di bawah 1024px')
    await page.goto('/chat')
    await visibleOnly(page.getByRole('button', { name: 'Buka riwayat' })).click()
    const drawer = page.getByRole('dialog', { name: 'Riwayat percakapan' })
    await expect(drawer.getByRole('link', { name: 'Sel tumbuhan' })).toBeVisible()

    await page.keyboard.press('Escape')
    await expect(drawer).toBeHidden()
  })
})
