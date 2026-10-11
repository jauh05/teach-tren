import { expect, test } from './fixtures'
import { expectNoHorizontalScroll, signOutFromMenu, visibleOnly } from './helpers'

test.describe('Jadwal', () => {
  test('menampilkan jadwal minggu ini dan Ingatan AI sesuai layar', async ({ page }, testInfo) => {
    await page.goto('/jadwal')
    await expect(page.getByRole('button', { name: 'Hari ini' })).toBeVisible()
    await expect(visibleOnly(page.getByText('Ulangi Sel tumbuhan'))).toBeVisible()
    await expect(visibleOnly(page.getByText('Karena skor 38 pada Sel tumbuhan'))).toBeVisible()

    if (testInfo.project.name === 'desktop') {
      await page.getByRole('button', { name: 'Ingatan AI' }).click()
      await expect(page.getByRole('complementary', { name: 'Ingatan AI' })).toBeVisible()
    } else {
      await expect(page.getByRole('link', { name: 'Ingatan AI' })).toBeVisible()
    }
    await expectNoHorizontalScroll(page)
  })

  test('saran diterima dengan tombol Terima', async ({ page }) => {
    await page.goto('/jadwal')
    const accept = visibleOnly(page.getByRole('button', { name: 'Terima saran Pertidaksamaan' }))
    await accept.click()

    await expect(accept).toHaveCount(0)
    await expect(visibleOnly(page.getByText('Pertidaksamaan'))).toBeVisible()

    // The accepted item is saved on the server, so it is still there after a refresh.
    await page.reload()
    await expect(visibleOnly(page.getByRole('button', { name: 'Terima saran Pertidaksamaan' }))).toHaveCount(0)
    await expect(visibleOnly(page.getByText('Pertidaksamaan'))).toBeVisible()
  })

  test('saran diseret ke hari lain di desktop', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'drag hanya tersedia di layar 768px ke atas')
    await page.goto('/jadwal')

    const source = page.locator('section[data-day-index="3"] [data-item-id]').filter({ hasText: 'Grafik fungsi' })
    const target = page.locator('section[data-day-index="2"]')
    await source.dragTo(target)

    await expect(target.getByText('Grafik fungsi')).toBeVisible()
    await expect(page.locator('section[data-day-index="3"]').getByText('Grafik fungsi')).toHaveCount(0)
  })

  test('navigasi minggu berpindah dan menampilkan kosong', async ({ page }) => {
    await page.goto('/jadwal')
    const header = page.getByRole('heading', { level: 1 })
    const before = await header.textContent()

    await page.getByRole('button', { name: 'Minggu berikutnya' }).click()
    await expect(header).not.toHaveText(before ?? '')
    await expect(visibleOnly(page.getByText('Belum ada jadwal')).first()).toBeVisible()

    await page.getByRole('button', { name: 'Hari ini' }).click()
    await expect(header).toHaveText(before ?? '')
  })

  test('halaman Ingatan AI di mobile menampilkan topik yang sudah dipelajari', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile', 'halaman Ingatan terpisah dipakai di layar kecil')
    await page.goto('/jadwal')
    await page.getByRole('link', { name: 'Ingatan AI' }).click()

    await expect(page).toHaveURL(/\/jadwal\/ingatan$/)
    await expect(page.getByText('Bilangan')).toBeVisible()
    await expect(page.getByText('skor 38')).toBeVisible()
  })

  test('tamu melihat contoh jadwal tanpa aksi', async ({ page }, testInfo) => {
    await page.goto('/chat')
    await signOutFromMenu(page)

    await page.goto('/jadwal')
    await expect(page.getByText('Jadwal belajar hanya untuk akun.')).toBeVisible()
    await expect(page.getByRole('button', { name: /Terima saran/ })).toHaveCount(0)

    if (testInfo.project.name === 'desktop') {
      await page.getByRole('button', { name: 'Ingatan AI' }).click()
      await expect(page.getByText('Ingatan AI tersedia setelah masuk.')).toBeVisible()
    } else {
      await page.goto('/jadwal/ingatan')
      await expect(page.getByText('Ingatan AI tersedia setelah masuk.')).toBeVisible()
    }
  })
})

test.describe('Default kalender', () => {
  test('tampilan awal selalu Minggu', async ({ page }) => {
    await page.goto('/jadwal')
    await expect(page.getByRole('radio', { name: 'Minggu' })).toHaveAttribute('aria-checked', 'true')
    await expect(page.getByRole('radio', { name: 'Bulan' })).toHaveAttribute('aria-checked', 'false')
    await page.getByRole('radio', { name: 'Bulan' }).click()
    await page.goto('/jadwal')
    await expect(page.getByRole('radio', { name: 'Minggu' })).toHaveAttribute('aria-checked', 'true')
  })
})

test.describe('Kalender bulan', () => {
  test('tampilan bulan menampilkan kotak kalender enam minggu di semua layar', async ({ page }) => {
    await page.goto('/jadwal')
    await page.getByRole('radio', { name: 'Bulan' }).click()
    await expect(page.locator('[data-date]:visible')).toHaveCount(42)
    await expect(page.getByRole('heading', { level: 1 })).toContainText('2026')
    await expectNoHorizontalScroll(page)
  })

  test('kembali ke minggu menampilkan agenda di mobile', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile', 'agenda harian hanya di layar kecil')
    await page.goto('/jadwal')
    await page.getByRole('radio', { name: 'Bulan' }).click()
    await expect(page.locator('[data-date]:visible')).toHaveCount(42)
    await page.getByRole('radio', { name: 'Minggu' }).click()
    await expect(page.locator('[data-day-index]:visible')).toHaveCount(7)
  })
})
