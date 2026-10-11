import { expect, test, type Page } from '@playwright/test'
import { expectNoHorizontalScroll } from './helpers'

const PDF_BYTES = Buffer.from('%PDF-1.7\n1 0 obj\n<< /Type /Catalog >>\nendobj\n%%EOF')

interface UploadFile {
  name: string
  mimeType: string
  buffer: Buffer
}

// Opens the upload pop-up from the page header, then picks the file inside it.
async function unggah(page: Page, file: UploadFile) {
  await page.getByRole('button', { name: 'Unggah materi' }).click()
  await expect(page.getByRole('dialog', { name: 'Unggah materi' })).toBeVisible()
  await page.locator('input[type="file"]').setInputFiles(file)
}

test.describe('Materi', () => {
  test('unggah PDF dari pop-up berubah dari Memproses ke Siap dengan ringkasan', async ({ page }) => {
    await page.goto('/materi')
    await unggah(page, { name: 'modul-persamaan.pdf', mimeType: 'application/pdf', buffer: PDF_BYTES })

    // The pop-up closes after a successful upload, and the new card shows in the list.
    await expect(page.getByRole('dialog')).toBeHidden()
    const card = page.getByRole('article').filter({ hasText: 'modul-persamaan' })
    await expect(card.getByText('Memproses', { exact: true })).toBeVisible()
    await expect(card.getByText('Siap', { exact: true })).toBeVisible({ timeout: 5000 })
    await expect(card.getByText('dibagi menjadi beberapa bagian utama')).toBeVisible()
    await expectNoHorizontalScroll(page)
  })

  test('teks biasa yang diberi ekstensi pdf ditolak dan pop-up tetap terbuka', async ({ page }) => {
    await page.goto('/materi')
    await unggah(page, { name: 'catatan.pdf', mimeType: 'application/pdf', buffer: Buffer.from('Ini teks biasa') })
    await expect(page.getByRole('alert').filter({ hasText: 'Isi berkas tidak sesuai dengan jenisnya.' })).toBeVisible()
    await expect(page.getByRole('dialog', { name: 'Unggah materi' })).toBeVisible()
  })

  test('berkas lebih dari 20 MB ditolak', async ({ page }) => {
    await page.goto('/materi')
    const big = Buffer.concat([Buffer.from('%PDF-1.7\n'), Buffer.alloc(20 * 1024 * 1024)])
    await unggah(page, { name: 'besar.pdf', mimeType: 'application/pdf', buffer: big })
    await expect(page.getByRole('alert').filter({ hasText: 'Ukuran berkas maksimal 20 MB.' })).toBeVisible()
  })

  test('pop-up unggah bisa ditutup dengan tombol Tutup', async ({ page }) => {
    await page.goto('/materi')
    await page.getByRole('button', { name: 'Unggah materi' }).click()
    await page.getByRole('dialog', { name: 'Unggah materi' }).getByRole('button', { name: 'Tutup' }).click()
    await expect(page.getByRole('dialog')).toBeHidden()
  })

  test('usulan topik membuat bulat baru di Learning', async ({ page }, testInfo) => {
    await page.goto('/materi')
    await unggah(page, { name: 'modul-persamaan.pdf', mimeType: 'application/pdf', buffer: PDF_BYTES })
    const card = page.getByRole('article').filter({ hasText: 'modul-persamaan' })
    await expect(card.getByText('Siap', { exact: true })).toBeVisible({ timeout: 5000 })

    await card.getByRole('button', { name: 'Buat bulat' }).first().click()
    await expect(card.getByRole('button', { name: 'Sudah dibuat' }).first()).toBeVisible()

    // Client-side navigation keeps the in-memory topic graph.
    const nav = page.getByRole('navigation', { name: testInfo.project.name === 'desktop' ? 'Navigasi utama' : 'Navigasi bawah' })
    await nav.getByRole('link', { name: 'Learning' }).click()
    await expect(page.getByRole('button', { name: /Pengantar modul-persamaan/ })).toBeVisible()
  })

  test('materi dikaitkan ke bulat dan tampil di topiknya', async ({ page }) => {
    await page.goto('/materi')
    await unggah(page, {
      name: 'catatan-fungsi.docx',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      buffer: Buffer.concat([Buffer.from([0x50, 0x4b, 0x03, 0x04]), Buffer.alloc(64)]),
    })
    const card = page.getByRole('article').filter({ hasText: 'catatan-fungsi' })
    await expect(card.getByText('Siap', { exact: true })).toBeVisible({ timeout: 5000 })

    await card.getByRole('combobox', { name: /Kaitkan ke bulat/ }).selectOption('fungsi-kuadrat')
    await expect(card.getByText('Terkait bulat Fungsi kuadrat')).toBeVisible()
  })
})
