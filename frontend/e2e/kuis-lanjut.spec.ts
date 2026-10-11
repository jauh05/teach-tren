import { expect, test, type Page } from './fixtures'
import { expectNoHorizontalScroll, signOutFromMenu } from './helpers'

async function answerChoice(page: Page, letter: string, next: string) {
  await page.getByRole('button', { name: `Pilihan ${letter}` }).click()
  await page.getByRole('button', { name: next }).click()
}

// Opens Atur kuis from the chat of persamaan-linear and starts a five-question quiz in that chat.
async function mulaiKuisDariChat(page: Page) {
  await page.goto('/c/persamaan-linear')
  await page.getByRole('region', { name: 'Langkah berikutnya' }).getByRole('button', { name: 'Mulai' }).click()
  const dialog = page.getByRole('dialog', { name: 'Atur kuis' })
  await expect(dialog).toBeVisible()
  await dialog.getByRole('radiogroup', { name: 'Jumlah soal' }).getByRole('radio', { name: '5', exact: true }).click()
  await dialog.getByRole('button', { name: 'Mulai kuis' }).click()
  await expect(page.getByRole('dialog')).toBeHidden()
}

test.describe('Kuis lanjutan', () => {
  test('atur kuis dari chat memulai kuis di dalam chat', async ({ page }) => {
    await mulaiKuisDariChat(page)

    await expect(page).toHaveURL(/\/c\/persamaan-linear$/)
    await expect(page.getByRole('region', { name: 'Kuis' }).getByText('Soal 1 dari 5')).toBeVisible()
    await expectNoHorizontalScroll(page)
  })

  test('kuis di chat bisa diperbesar layar penuh, dikecilkan, lalu ditutup kembali ke chat', async ({ page }) => {
    await mulaiKuisDariChat(page)
    const quiz = page.getByRole('region', { name: 'Kuis' })
    const viewport = page.viewportSize()

    await page.getByRole('button', { name: 'Perbesar kuis' }).click()
    await expect(page.getByRole('button', { name: 'Kecilkan kuis' })).toBeVisible()
    const expandedBox = await quiz.boundingBox()
    expect(expandedBox?.width).toBe(viewport?.width)
    expect(expandedBox?.height).toBe(viewport?.height)

    await page.getByRole('button', { name: 'Kecilkan kuis' }).click()
    await expect(page.getByRole('button', { name: 'Perbesar kuis' })).toBeVisible()
    const shrunkBox = await quiz.boundingBox()
    expect(shrunkBox?.height).toBeLessThan(viewport?.height ?? 0)

    await page.getByRole('button', { name: 'Tutup kuis' }).click()
    await expect(page.getByRole('region', { name: 'Kuis' })).toBeHidden()
    await expect(page.getByRole('textbox', { name: 'Tulis pertanyaan' })).toBeVisible()
  })

  test('Escape mengecilkan kuis layar penuh', async ({ page }) => {
    await mulaiKuisDariChat(page)
    await page.getByRole('button', { name: 'Perbesar kuis' }).click()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('button', { name: 'Perbesar kuis' })).toBeVisible()
    await expect(page.getByRole('region', { name: 'Kuis' })).toBeVisible()
  })

  test('pop-up atur kuis bisa ditutup tanpa memulai kuis', async ({ page }) => {
    await page.goto('/c/persamaan-linear')
    await page.getByRole('region', { name: 'Langkah berikutnya' }).getByRole('button', { name: 'Mulai' }).click()
    await expect(page.getByRole('dialog', { name: 'Atur kuis' })).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).toBeHidden()
    await expect(page).toHaveURL(/\/c\/persamaan-linear$/)
  })

  test('atur kuis membuat kuis sesuai jumlah dan gaya yang dipilih', async ({ page }) => {
    await page.goto('/kuis/persamaan-linear/atur')
    await page.getByRole('radiogroup', { name: 'Jumlah soal' }).getByRole('radio', { name: '10', exact: true }).click()
    await page.getByRole('radiogroup', { name: 'Tingkat' }).getByRole('radio', { name: 'Sulit' }).click()
    await page.getByRole('radiogroup', { name: 'Gaya kuis' }).getByRole('radio', { name: 'Pilihan ganda saja' }).click()
    await page.getByRole('button', { name: 'Mulai kuis' }).click()

    await expect(page).toHaveURL(/jumlah=10/)
    await expect(page.getByText('Soal 1 dari 10')).toBeVisible()
    await expect(page.getByText('Sulit · Pilihan ganda saja')).toBeVisible()
    await expectNoHorizontalScroll(page)
  })

  test('isian diperiksa: jawaban yang diterima benar, selain itu salah', async ({ page }) => {
    await page.goto('/kuis/persamaan-linear?jumlah=10&gaya=Campuran')
    for (const letter of ['B', 'A', 'B', 'A', 'C']) {
      await answerChoice(page, letter, 'Soal berikutnya')
    }

    // Question 6 is a fill-in question. "4.000" matches the accepted answer "4000".
    await expect(page.getByText('Isian singkat', { exact: true })).toBeVisible()
    await page.getByRole('textbox', { name: 'Jawaban isian' }).fill('4.000')
    await page.getByRole('button', { name: 'Periksa jawaban' }).click()
    await expect(page.getByText('Jawabanmu benar')).toBeVisible()
    await page.getByRole('button', { name: 'Soal berikutnya' }).click()

    // Question 7 is also fill-in. A wrong number scores zero.
    await page.getByRole('textbox', { name: 'Jawaban isian' }).fill('5000')
    await page.getByRole('button', { name: 'Periksa jawaban' }).click()
    await expect(page.getByText('Nilai 0', { exact: true })).toBeVisible()
  })

  test('esai disimpan saat dijawab dan dinilai saat kuis dikumpulkan', async ({ page }) => {
    // Campuran is not used here. The "Banyak cerita" pool puts two essays at positions four and five.
    await page.goto('/kuis/persamaan-linear?jumlah=5&gaya=Banyak+cerita')
    await answerChoice(page, 'B', 'Soal berikutnya')
    await answerChoice(page, 'A', 'Soal berikutnya')
    await answerChoice(page, 'C', 'Soal berikutnya')

    await expect(page.getByText('Esai singkat', { exact: true })).toBeVisible()
    await page.getByRole('textbox', { name: 'Jawaban esai' }).fill('Pertama kurangi 3000 dari kedua ruas, lalu bagi dengan 2, dan periksa dengan substitusi.')
    await page.getByRole('button', { name: 'Kirim jawaban' }).click()
    await expect(page.getByText('Tersimpan. Dinilai saat kuis dikumpulkan.')).toBeVisible()
    await page.getByRole('button', { name: 'Soal berikutnya' }).click()

    await page.getByRole('textbox', { name: 'Jawaban esai' }).fill('Sel tumbuhan memiliki dinding sel dan kloroplas.')
    await page.getByRole('button', { name: 'Kirim jawaban' }).click()
    await page.getByRole('button', { name: 'Lihat hasil' }).click()

    await expect(page.getByText('Skor kuis')).toBeVisible()
    await page.getByText('Soal 4', { exact: true }).click()
    await expect(page.getByText('Nilai esai: 100').first()).toBeVisible()
    await expect(page.getByText('Ditandai untuk ditinjau.')).toHaveCount(0)
  })

  test('hasil menampilkan rincian dan bisa mengulang soal salah', async ({ page }) => {
    await page.goto('/kuis/persamaan-linear?jumlah=5&gaya=Pilihan+ganda+saja')
    for (let index = 0; index < 5; index++) {
      await answerChoice(page, 'A', index < 4 ? 'Soal berikutnya' : 'Lihat hasil')
    }

    await expect(page.getByText('Skor kuis')).toBeVisible()
    await page.getByRole('button', { name: 'Ulangi soal salah (3)' }).click()
    await expect(page.getByText('Soal 1 dari 3')).toBeVisible()
    await expect(page.getByText('ulangi soal salah')).toBeVisible()
  })

  test('tamu tidak bisa memilih jumlah soal selain lima', async ({ page }) => {
    await page.goto('/chat')
    await signOutFromMenu(page)

    await page.goto('/kuis/persamaan-linear/atur')
    await expect(page.getByRole('radiogroup', { name: 'Jumlah soal' }).getByRole('radio', { name: '20' })).toBeDisabled()
    await expect(page.getByText('Tamu mendapat lima soal.')).toBeVisible()
  })
})
