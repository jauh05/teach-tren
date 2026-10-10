import { expect, test, type Locator, type Page } from '@playwright/test'
import { expectNoHorizontalScroll, visibleOnly } from './helpers'

function topic(page: Page, id: string) {
  return page.locator(`[data-topic-id="${id}"][role="button"]`)
}

// Topics breathe (idle drift), so Playwright's click() would wait for a stable box. Click the center instead.
async function clickCenter(page: Page, locator: Locator) {
  const box = await locator.boundingBox()
  if (!box) {
    throw new Error('Elemen tidak terlihat di kanvas')
  }
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2)
}

async function dragTopic(page: Page, id: string, dx: number, dy: number) {
  const box = await topic(page, id).boundingBox()
  if (!box) {
    throw new Error(`Bulat ${id} tidak ditemukan`)
  }
  const startX = box.x + box.width / 2
  const startY = box.y + box.height / 2
  await page.mouse.move(startX, startY)
  await page.mouse.down()
  await page.mouse.move(startX + dx, startY + dy, { steps: 12 })
  await page.mouse.up()
  // The simulation stops within one second after release (docs/role.md 4.1).
  await page.waitForTimeout(1200)
}

test.describe('Learning', () => {
  test('kanvas dan kontrol zoom tampil tanpa scroll horizontal', async ({ page }) => {
    await page.goto('/learning')
    await expect(page.getByRole('group', { name: 'Kanvas bulat belajar' })).toBeVisible()
    await expect(page.getByRole('toolbar', { name: 'Kontrol zoom' })).toBeVisible()
    await expect(topic(page, 'persamaan-linear')).toBeVisible()
    await expectNoHorizontalScroll(page)
  })

  test('zoom dibatasi 40 sampai 200 persen', async ({ page }) => {
    await page.goto('/learning')
    const toolbar = page.getByRole('toolbar', { name: 'Kontrol zoom' })
    await expect(toolbar.getByText('100%')).toBeVisible()

    await toolbar.getByRole('button', { name: 'Perbesar' }).click()
    await expect(toolbar.getByText('125%')).toBeVisible()

    for (let step = 0; step < 15; step++) {
      await toolbar.getByRole('button', { name: 'Perkecil' }).click()
    }
    await expect(toolbar.getByText('40%')).toBeVisible()

    for (let step = 0; step < 20; step++) {
      await toolbar.getByRole('button', { name: 'Perbesar' }).click()
    }
    await expect(toolbar.getByText('200%')).toBeVisible()

    await toolbar.getByRole('button', { name: 'Atur ulang zoom' }).click()
    await expect(toolbar.getByText('100%')).toBeVisible()
  })

  test('tarik bulat menggeser bulat itu', async ({ page }) => {
    await page.goto('/learning')
    await page.waitForTimeout(500)
    const before = await topic(page, 'sel-tumbuhan').boundingBox()
    if (!before) {
      throw new Error('Bulat sel-tumbuhan tidak ditemukan')
    }

    await dragTopic(page, 'sel-tumbuhan', -90, 30)

    const after = await topic(page, 'sel-tumbuhan').boundingBox()
    expect(after).not.toBeNull()
    expect(Math.abs((after?.x ?? 0) - before.x)).toBeGreaterThan(40)
  })

  test('refresh mengembalikan tata letak awal', async ({ page }) => {
    await page.goto('/learning')
    await page.waitForTimeout(500)
    const initial = await topic(page, 'sel-tumbuhan').boundingBox()

    await dragTopic(page, 'sel-tumbuhan', -90, 30)
    await page.reload()
    await page.waitForTimeout(500)

    const reloaded = await topic(page, 'sel-tumbuhan').boundingBox()
    expect(Math.abs((reloaded?.x ?? 0) - (initial?.x ?? 0))).toBeLessThan(2)
    expect(Math.abs((reloaded?.y ?? 0) - (initial?.y ?? 0))).toBeLessThan(2)
  })

  test('ketuk bulat membuka panel detail dan mulai chat dari panel', async ({ page }) => {
    await page.goto('/learning')
    await clickCenter(page, topic(page, 'persamaan-linear'))

    const panel = page.getByRole('complementary', { name: 'Detail bulat' })
    await expect(panel.getByRole('heading', { name: 'Persamaan linear' })).toBeVisible()
    await expect(panel.getByText('72')).toBeVisible()

    await panel.getByRole('button', { name: 'Mulai chat' }).click()
    await expect(page).toHaveURL(/\/c\/baru$/)
  })

  test('tombol plus membuka chat dengan konteks topik', async ({ page }) => {
    await page.goto('/learning')
    await clickCenter(page, page.locator('[data-topic-action="chat"][data-topic-id="bilangan"]'))

    await expect(page).toHaveURL(/\/c\/baru$/)
    await expect(page.getByText('Jelaskan Bilangan')).toBeVisible()
  })

  test('panah berpindah antar bulat dan Enter membuka detail', async ({ page }) => {
    await page.goto('/learning')
    await topic(page, 'persamaan-linear').focus()
    await page.keyboard.press('ArrowLeft')
    await expect(topic(page, 'bilangan')).toBeFocused()

    await page.keyboard.press('Enter')
    await expect(page.getByRole('heading', { name: 'Bilangan' })).toBeVisible()
  })

  test('legenda tampil di desktop dan dibuka dari tombol di mobile', async ({ page }, testInfo) => {
    await page.goto('/learning')
    if (testInfo.project.name === 'desktop') {
      await expect(visibleOnly(page.getByText('Skor 80 ke atas'))).toBeVisible()
      return
    }
    await page.getByRole('button', { name: 'Keterangan' }).click()
    await expect(visibleOnly(page.getByText('Skor 80 ke atas'))).toBeVisible()
  })
})
