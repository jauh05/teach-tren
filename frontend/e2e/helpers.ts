import { expect, type Locator, type Page } from '@playwright/test'

// Fails when the page is wider than the viewport. Required at 1280px and 390px (docs/role.md 3).
export async function expectNoHorizontalScroll(page: Page): Promise<void> {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )
  expect(overflow).toBeLessThanOrEqual(0)
}

// Desktop and mobile headers render the same controls. Keep only the one that is visible.
export function visibleOnly(locator: Locator): Locator {
  return locator.filter({ visible: true })
}

// Signs out from the avatar menu and waits until the server has ended the session and issued a new guest id.
// On a page that stays on /chat a URL check passes at once, so it cannot tell when the sign-out is done.
export async function signOutFromMenu(page: Page): Promise<void> {
  const logout = page.waitForResponse((response) => response.url().endsWith('/api/auth/logout'))
  const guestSession = page.waitForResponse((response) => response.url().endsWith('/api/guest/session'))
  await visibleOnly(page.getByRole('button', { name: 'Menu akun' })).click()
  await page.getByRole('menuitem', { name: 'Keluar' }).click()
  await logout
  await guestSession
}
