import { expect, test } from './fixtures'
import { expectNoHorizontalScroll, signOutFromMenu, visibleOnly } from './helpers'

const DESKTOP_NAV = 'Navigasi utama'
const MOBILE_NAV = 'Navigasi bawah'

test.describe('app shell', () => {
  test('navigasi utama di desktop dan navigasi bawah di mobile', async ({ page }, testInfo) => {
    await page.goto('/learning')
    await expect(page).toHaveTitle('Teach Tren')

    const isDesktop = testInfo.project.name === 'desktop'
    await expect(page.getByRole('navigation', { name: isDesktop ? DESKTOP_NAV : MOBILE_NAV })).toBeVisible()
    await expect(page.getByRole('navigation', { name: isDesktop ? MOBILE_NAV : DESKTOP_NAV })).toBeHidden()
    await expectNoHorizontalScroll(page)
  })

  test('tab aktif mengikuti route', async ({ page }, testInfo) => {
    const navName = testInfo.project.name === 'desktop' ? DESKTOP_NAV : MOBILE_NAV
    await page.goto('/learning')
    const nav = page.getByRole('navigation', { name: navName })

    await expect(nav.getByRole('link', { name: 'Learning' })).toHaveAttribute('aria-current', 'page')

    await nav.getByRole('link', { name: 'Jadwal' }).click()
    await expect(page).toHaveURL(/\/jadwal$/)
    await expect(nav.getByRole('link', { name: 'Jadwal' })).toHaveAttribute('aria-current', 'page')
    await expect(nav.getByRole('link', { name: 'Learning' })).not.toHaveAttribute('aria-current', 'page')

    // Desktop keeps Pengaturan in the avatar menu. Only the mobile bottom bar has the link.
    if ((await nav.getByRole('link', { name: 'Pengaturan' }).count()) > 0) {
      await nav.getByRole('link', { name: 'Pengaturan' }).click()
      await expect(nav.getByRole('link', { name: 'Pengaturan' })).toHaveAttribute('aria-current', 'page')
    } else {
      await visibleOnly(page.getByRole('button', { name: 'Menu akun' })).click()
      await page.getByRole('menuitem', { name: 'Profil' }).click()
    }
    await expect(page).toHaveURL(/\/pengaturan$/)
    await expectNoHorizontalScroll(page)
  })

  test('menu akun dibuka dan ditutup dengan Escape', async ({ page }) => {
    await page.goto('/chat')
    await visibleOnly(page.getByRole('button', { name: 'Menu akun' })).click()
    await expect(page.getByRole('menu')).toBeVisible()
    await expect(page.getByRole('menuitem', { name: 'Tentang' })).toBeVisible()

    await page.keyboard.press('Escape')
    await expect(page.getByRole('menu')).toBeHidden()
  })

  test('keluar mengubah status menjadi tamu', async ({ page }) => {
    await page.goto('/chat')
    await signOutFromMenu(page)

    await expect(page.locator('header:visible').getByText('Tamu')).toBeVisible()

    await visibleOnly(page.getByRole('button', { name: 'Menu akun' })).click()
    await expect(page.getByRole('menuitem', { name: 'Masuk' })).toBeVisible()
    await expect(page.getByRole('menuitem', { name: 'Daftar' })).toBeVisible()
    await expect(page.getByRole('menuitem', { name: 'Keluar' })).toHaveCount(0)
  })
})
