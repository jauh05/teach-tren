import { expect, test, type Page } from './fixtures'
import { expectNoHorizontalScroll } from './helpers'
import { readFileSync } from 'node:fs'
import path from 'node:path'

// Real files with text (folder e2e/berkas). The server reads them, so they must be valid.
const BERKAS = path.resolve('e2e', 'berkas')
const PDF_BYTES = readFileSync(path.join(BERKAS, 'modul-persamaan.pdf'))
const DOCX_BYTES = readFileSync(path.join(BERKAS, 'catatan-fungsi.docx'))

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
  test('unggah PDF dari pop-up menampilkan ringkasan setelah diproses', async ({ page }) => {
    await page.goto('/materi')
    await unggah(page, { name: 'modul-persamaan.pdf', mimeType: 'application/pdf', buffer: PDF_BYTES })

    // The pop-up closes after a successful upload, and the new card shows in the list.
    await expect(page.getByRole('dialog')).toBeHidden()
    const card = page.getByRole('article').filter({ hasText: 'modul-persamaan' })
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
    // A fresh load of Learning, as the user would see it. The topic is saved on the server.
    await page.reload()
    const created = page.getByRole('button', { name: /Pengantar materi/ })
    await expect(created).toBeVisible()

    // The new topic is placed in the middle of the canvas, so the plus button can be clicked on both layouts.
    const id = await created.getAttribute('data-topic-id')
    // Topics drift slowly, so click the center of the element instead of waiting for it to stop moving.
    const box = await page.locator(`[data-topic-action="chat"][data-topic-id="${id}"]`).boundingBox()
    if (!box) {
      throw new Error('Tombol chat bulat tidak terlihat')
    }
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2)
    await expect(page.getByRole('complementary', { name: 'Chat topik' }).getByRole('heading', { name: /Pengantar materi/ })).toBeVisible()
  })

  test('materi dikaitkan ke bulat dan tampil di topiknya', async ({ page }) => {
    await page.goto('/materi')
    await unggah(page, {
      name: 'catatan-fungsi.docx',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      buffer: DOCX_BYTES,
    })
    const card = page.getByRole('article').filter({ hasText: 'catatan-fungsi' })
    await expect(card.getByText('Siap', { exact: true })).toBeVisible({ timeout: 5000 })

    await card.getByRole('combobox', { name: /Kaitkan ke bulat/ }).selectOption('fungsi-kuadrat')
    await expect(card.getByText('Terkait bulat Fungsi kuadrat')).toBeVisible()
  })
})
