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
