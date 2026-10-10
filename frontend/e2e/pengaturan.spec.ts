import { expect, test, type Page } from '@playwright/test'
import { expectNoHorizontalScroll, visibleOnly } from './helpers'

async function signOut(page: Page) {
  await page.goto('/chat')
  await visibleOnly(page.getByRole('button', { name: 'Menu akun' })).click()
  await page.getByRole('menuitem', { name: 'Keluar' }).click()
  await expect(page).toHaveURL(/\/chat$/)
}

test.describe('Pengaturan', () => {
  test('menampilkan semua bagian pengaturan', async ({ page }, testInfo) => {
    await page.goto('/pengaturan')
    await expect(page.getByRole('heading', { name: 'Pengaturan', level: 1 })).toBeVisible()
    for (const title of ['Profil', 'Belajar', 'Tampilan dan notifikasi', 'Data dan privasi', 'Bantuan']) {
      await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible()
    }
    await expect(page.getByText('email tidak bisa diubah')).toBeVisible()
    await expect(page.getByRole('navigation', { name: 'Bagian pengaturan' })).toBeVisible({
      visible: testInfo.project.name === 'desktop',
    })
    await expectNoHorizontalScroll(page)
  })

  test('tamu diarahkan ke masuk lalu kembali ke pengaturan', async ({ page }) => {
    await signOut(page)
    await page.goto('/pengaturan')
    await expect(page).toHaveURL(/\/masuk\?redirect=%2Fpengaturan$/)

    await page.getByLabel('Email').fill('rafi@contoh.id')
    await page.getByLabel('Kata sandi').fill('rahasia123')
    await page.getByRole('button', { name: 'Masuk', exact: true }).click()
    await expect(page).toHaveURL(/\/pengaturan$/)
  })

  test('pilihan belajar tetap tersimpan setelah muat ulang', async ({ page }) => {
    await page.goto('/pengaturan')
    await page.getByRole('radio', { name: '20', exact: true }).click()
    await expect(page.getByRole('radio', { name: '20', exact: true })).toHaveAttribute('aria-checked', 'true')

    await page.reload()
    await expect(page.getByRole('radio', { name: '20', exact: true })).toHaveAttribute('aria-checked', 'true')
  })

  test('ubah profil memperbarui nama', async ({ page }, testInfo) => {
    await page.goto('/pengaturan')
    await page.getByRole('button', { name: 'Ubah profil' }).click()
    await page.getByLabel('Nama tampilan').fill('Siti Aminah')
    await page.getByRole('button', { name: 'Simpan' }).click()

    await expect(page.getByRole('status').filter({ hasText: 'Profil diperbarui.' })).toBeVisible()
    await expect(page.getByText('Siti Aminah')).toBeVisible()
    if (testInfo.project.name === 'desktop') {
      await expect(page.locator('header:visible').getByText('Siti', { exact: true })).toBeVisible()
    }
  })

  test('ubah kata sandi menolak konfirmasi yang tidak sama', async ({ page }) => {
    await page.goto('/pengaturan')
    await page.getByRole('button', { name: 'Ubah kata sandi' }).click()
    await page.getByLabel('Kata sandi lama').fill('lama12345')
    await page.getByLabel('Kata sandi baru', { exact: true }).fill('baru12345')
    await page.getByLabel('Ulangi kata sandi baru').fill('beda12345')
    await page.getByRole('button', { name: 'Simpan' }).click()

    await expect(page.getByRole('alert').filter({ hasText: 'Konfirmasi kata sandi tidak sama.' })).toBeVisible()
  })

  test('hapus semua riwayat butuh ketikan HAPUS', async ({ page }) => {
    await page.goto('/pengaturan')
    await page.getByRole('button', { name: 'Hapus semua riwayat' }).click()
    const confirm = page.getByRole('button', { name: 'Hapus semua', exact: true })
    await expect(confirm).toBeDisabled()

    const input = page.getByLabel('Ketik HAPUS untuk konfirmasi')
    await input.fill('hapus')
    await expect(confirm).toBeDisabled()

    await input.fill('HAPUS')
    await expect(confirm).toBeEnabled()
    await confirm.click()
    await expect(page.getByRole('status').filter({ hasText: 'Semua riwayat dihapus.' })).toBeVisible()
  })

  test('hapus akun meminta kata sandi lalu mengubah status menjadi tamu', async ({ page }) => {
    await page.goto('/pengaturan')
    await page.getByRole('button', { name: 'Hapus akun' }).click()
    await page.getByRole('button', { name: 'Hapus akun', exact: true }).last().click()
    await expect(page.getByRole('alert').filter({ hasText: 'Masukkan kata sandi untuk konfirmasi.' })).toBeVisible()

    await page.getByLabel('Kata sandi untuk konfirmasi').fill('rahasia123')
    await page.getByRole('button', { name: 'Hapus akun', exact: true }).last().click()
    await expect(page).toHaveURL(/\/chat$/)
  })

  test('keluar dari pengaturan kembali sebagai tamu', async ({ page }) => {
    await page.goto('/pengaturan')
    await page.getByRole('button', { name: 'Keluar', exact: true }).last().click()
    await expect(page).toHaveURL(/\/chat$/)

    await visibleOnly(page.getByRole('button', { name: 'Menu akun' })).click()
    await expect(page.getByRole('menuitem', { name: 'Masuk' })).toBeVisible()
  })

  test('ekspor riwayat mengunduh berkas JSON', async ({ page }) => {
    await page.goto('/pengaturan')
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: 'Ekspor riwayat (JSON)' }).click(),
    ])
    expect(download.suggestedFilename()).toBe('riwayat-teach-tren.json')
  })

  test('mode gelap ditandai segera hadir dan tidak bisa dipilih', async ({ page }) => {
    await page.goto('/pengaturan')
    await expect(page.getByRole('radio', { name: 'Gelap (segera hadir)' })).toBeDisabled()
  })
})
