import { expect, test, type Locator, type Page } from '@playwright/test'
import { expectNoHorizontalScroll, visibleOnly } from './helpers'

const DESKTOP_NAV = 'Navigasi utama'
const MOBILE_NAV = 'Navigasi bawah'

function topic(page: Page, id: string) {
  return page.locator(`[data-topic-id="${id}"][role="button"]`)
}

function topicChat(page: Page) {
  return page.getByRole('complementary', { name: 'Chat topik' })
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
    const before = await topic(page, 'persamaan-linear').boundingBox()
    if (!before) {
      throw new Error('Bulat persamaan-linear tidak ditemukan')
    }

    await dragTopic(page, 'persamaan-linear', -90, 30)

    const after = await topic(page, 'persamaan-linear').boundingBox()
    expect(after).not.toBeNull()
    expect(Math.abs((after?.x ?? 0) - before.x)).toBeGreaterThan(20)
  })

  test('refresh mengembalikan tata letak awal', async ({ page }) => {
    await page.goto('/learning')
    await page.waitForTimeout(500)
    const initial = await topic(page, 'persamaan-linear').boundingBox()

    await dragTopic(page, 'persamaan-linear', -90, 30)
    await page.reload()
    await page.waitForTimeout(500)

    const reloaded = await topic(page, 'persamaan-linear').boundingBox()
    expect(Math.abs((reloaded?.x ?? 0) - (initial?.x ?? 0))).toBeLessThan(2)
    expect(Math.abs((reloaded?.y ?? 0) - (initial?.y ?? 0))).toBeLessThan(2)
  })

  test('nama bulat tidak saling menabrak', async ({ page }) => {
    await page.goto('/learning')
    await page.waitForTimeout(800)

    const overlaps = await page.evaluate(() => {
      const groups = Array.from(document.querySelectorAll<SVGGElement>('[data-topic-id][role="button"]'))
      const boxes = groups.map((group) => {
        const rects = Array.from(group.querySelectorAll('text')).map((text) => text.getBoundingClientRect())
        const left = Math.min(...rects.map((rect) => rect.left))
        const right = Math.max(...rects.map((rect) => rect.right))
        const top = Math.min(...rects.map((rect) => rect.top))
        const bottom = Math.max(...rects.map((rect) => rect.bottom))
        return { id: group.dataset.topicId ?? '', left, right, top, bottom }
      })
      const pairs: string[] = []
      for (let i = 0; i < boxes.length; i++) {
        for (let j = i + 1; j < boxes.length; j++) {
          const a = boxes[i]
          const b = boxes[j]
          const overlapX = Math.min(a.right, b.right) - Math.max(a.left, b.left)
          const overlapY = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top)
          if (overlapX > 1 && overlapY > 1) {
            pairs.push(`${a.id}/${b.id}`)
          }
        }
      }
      return pairs
    })

    expect(overlaps).toEqual([])
  })

  test('ketuk bulat membuka chat topik', async ({ page }) => {
    await page.goto('/learning')
    await clickCenter(page, topic(page, 'persamaan-linear'))

    const panel = topicChat(page)
    await expect(panel.getByRole('heading', { name: 'Persamaan linear' })).toBeVisible()
    await expect(panel.getByText('Bagaimana cara menyelesaikan persamaan 2x + 3000 = 11000?')).toBeVisible()
    await expectNoHorizontalScroll(page)
  })

  test('chat topik yang dikirim muncul di riwayat chat umum', async ({ page }, testInfo) => {
    await page.goto('/learning')
    await clickCenter(page, topic(page, 'fungsi-kuadrat'))

    const panel = topicChat(page)
    await panel.getByRole('textbox', { name: 'Tulis pertanyaan' }).fill('Apa itu fungsi kuadrat?')
    await panel.getByRole('textbox', { name: 'Tulis pertanyaan' }).press('Enter')
    await expect(panel.getByRole('button', { name: 'Kirim pesan' })).toBeVisible({ timeout: 15_000 })

    // Client-side navigation keeps the in-memory conversation store.
    const nav = page.getByRole('navigation', { name: testInfo.project.name === 'desktop' ? DESKTOP_NAV : MOBILE_NAV })
    await nav.getByRole('link', { name: 'Chat' }).click()
    if (testInfo.project.name === 'mobile') {
      await visibleOnly(page.getByRole('button', { name: 'Buka riwayat' })).click()
      await expect(page.getByRole('dialog', { name: 'Riwayat percakapan' }).getByRole('link', { name: 'Fungsi kuadrat' })).toBeVisible()
      return
    }
    await expect(page.getByRole('navigation', { name: 'Riwayat percakapan' }).getByRole('link', { name: 'Fungsi kuadrat' })).toBeVisible()
  })

  test('tombol plus membuka chat topik', async ({ page }) => {
    await page.goto('/learning')
    await clickCenter(page, page.locator('[data-topic-action="chat"][data-topic-id="bilangan"]'))

    await expect(topicChat(page).getByRole('heading', { name: 'Bilangan' })).toBeVisible()
  })

  test('panah berpindah antar bulat dan Enter membuka chat topik', async ({ page }) => {
    await page.goto('/learning')
    await topic(page, 'persamaan-linear').focus()
    await page.keyboard.press('ArrowLeft')
    await expect(topic(page, 'bilangan')).toBeFocused()

    await page.keyboard.press('Enter')
    await expect(topicChat(page).getByRole('heading', { name: 'Bilangan' })).toBeVisible()
  })

  test('chat belajar selalu terlihat tanpa bulat dipilih', async ({ page }) => {
    await page.goto('/learning')
    await expect(topicChat(page).getByRole('heading', { name: 'Chat belajar umum' })).toBeVisible()
    await expect(topicChat(page).getByRole('textbox', { name: 'Tulis pertanyaan' })).toBeVisible()
    await expectNoHorizontalScroll(page)
  })

  test('papan bisa diperbesar dan chat tetap terlihat', async ({ page }) => {
    await page.goto('/learning')
    const toggle = page.getByRole('button', { name: 'Perbesar papan' })
    await toggle.click()
    await expect(page.getByRole('button', { name: 'Kecilkan papan' })).toBeVisible()
    await expect(topicChat(page).getByRole('textbox', { name: 'Tulis pertanyaan' })).toBeVisible()
    await page.getByRole('button', { name: 'Kecilkan papan' }).click()
    await expect(page.getByRole('button', { name: 'Perbesar papan' })).toBeVisible()
  })

  test('keterangan bisa dibuka dan ditutup', async ({ page }) => {
    await page.goto('/learning')
    await expect(page.getByText('Skor 80 ke atas')).toBeHidden()
    await page.getByRole('button', { name: 'Lihat keterangan' }).click()
    await expect(page.getByText('Skor 80 ke atas')).toBeVisible()
    await page.getByRole('button', { name: 'Sembunyikan keterangan' }).click()
    await expect(page.getByText('Skor 80 ke atas')).toBeHidden()
  })
})
