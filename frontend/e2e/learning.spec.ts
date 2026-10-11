import { expect, test, type Locator, type Page } from './fixtures'
import { expectNoHorizontalScroll, signOutFromMenu, visibleOnly } from './helpers'

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
    // Focus and Enter opens the topic chat. A pointer click can land on the toolbar on small screens.
    await topic(page, 'fungsi-kuadrat').focus()
    await page.keyboard.press('Enter')

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

test.describe('Learning tamu', () => {
  test.use({ asGuest: true })

  test('tamu melihat kanvas kosong dengan lingkaran tambah dan kontrol zoom tanpa tombol simpan', async ({ page }) => {
    await page.goto('/learning')
    await expect(page.getByRole('button', { name: 'Tambah belajar pertama' })).toBeVisible()
    await expect(page.getByText('Klik untuk menambahkan pola belajar')).toBeVisible()
    await expect(page.getByLabel('Kontrol zoom')).toBeVisible()
    await expect(page.getByRole('button', { name: /simpan/i })).toHaveCount(0)
    await expectNoHorizontalScroll(page)
  })

  test('zoom bekerja di kanvas kosong, dan bulat contoh ikut membesar dan kembali', async ({ page }) => {
    await page.goto('/learning')
    const toolbar = page.getByRole('toolbar', { name: 'Kontrol zoom' })
    const sample = page.locator('[data-sample="DIKUASAI"] circle')
    const before = await sample.boundingBox()
    if (!before) {
      throw new Error('Bulat contoh tidak terlihat')
    }

    await toolbar.getByRole('button', { name: 'Perbesar' }).click()
    await expect(toolbar.getByText('125%')).toBeVisible()
    await expect.poll(async () => (await sample.boundingBox())?.width ?? 0).toBeGreaterThan(before.width + 4)

    await toolbar.getByRole('button', { name: 'Atur ulang zoom' }).click()
    await expect(toolbar.getByText('100%')).toBeVisible()
    await expect.poll(async () => (await sample.boundingBox())?.width ?? 0).toBeLessThan(before.width + 2)
  })

  test('di desktop, tombol tambah ada di tengah papan', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'papan di tengah hanya di layar lebar')
    await page.goto('/learning')
    const board = await page.locator('[data-canvas-board]').boundingBox()
    const slot = await page.getByRole('button', { name: 'Tambah belajar pertama' }).boundingBox()
    if (!board || !slot) {
      throw new Error('Papan atau tombol tambah tidak terlihat')
    }
    expect(Math.abs(slot.x + slot.width / 2 - (board.x + board.width / 2))).toBeLessThan(6)
    expect(Math.abs(slot.y + slot.height / 2 - (board.y + board.height / 2))).toBeLessThan(6)
  })

  test('bulat contoh tidak menimpa tombol papan saat ditarik ke sana', async ({ page }) => {
    await page.goto('/learning')
    const sample = page.locator('[data-sample="DIKUASAI"] circle')
    const control = page.getByRole('button', { name: 'Perbesar papan' })
    const from = await sample.boundingBox()
    const target = await control.boundingBox()
    if (!from || !target) {
      throw new Error('Bulat contoh atau tombol papan tidak terlihat')
    }
    await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2)
    await page.mouse.down()
    await page.mouse.move(target.x + target.width / 2, target.y + target.height / 2, { steps: 12 })
    await page.mouse.up()
    // Let the layout settle after the drag, then compare the boxes.
    await page.waitForTimeout(600)

    const circle = await sample.boundingBox()
    const after = await control.boundingBox()
    if (!circle || !after) {
      throw new Error('Bulat contoh atau tombol papan tidak terlihat')
    }
    const overlaps =
      circle.x < after.x + after.width && circle.x + circle.width > after.x && circle.y < after.y + after.height && circle.y + circle.height > after.y
    expect(overlaps).toBe(false)
  })

  test('bulat contoh di kanvas kosong bisa digeser', async ({ page }) => {
    await page.goto('/learning')
    const sample = page.locator('[data-sample="PERLU_DIULANG"] circle')
    const before = await sample.boundingBox()
    if (!before) {
      throw new Error('Bulat contoh tidak terlihat')
    }
    const startX = before.x + before.width / 2
    const startY = before.y + before.height / 2
    await page.mouse.move(startX, startY)
    await page.mouse.down()
    await page.mouse.move(startX - 16, startY, { steps: 8 })
    await page.mouse.up()

    await expect.poll(async () => before.x - ((await sample.boundingBox())?.x ?? 0)).toBeGreaterThan(4)
  })

  test('bulat contoh yang terhubung ikut bergerak saat satu bulat ditarik', async ({ page }) => {
    await page.goto('/learning')
    const dragged = page.locator('[data-sample="BARU"] circle')
    const linked = page.locator('[data-sample="PERLU_DIULANG"] circle')
    const draggedBox = await dragged.boundingBox()
    const linkedBefore = await linked.boundingBox()
    if (!draggedBox || !linkedBefore) {
      throw new Error('Bulat contoh tidak terlihat')
    }
    // Pulled a little to the left. The circle linked to it follows, as on the real canvas.
    const startX = draggedBox.x + draggedBox.width / 2
    const startY = draggedBox.y + draggedBox.height / 2
    await page.mouse.move(startX, startY)
    await page.mouse.down()
    await page.mouse.move(startX - 30, startY, { steps: 8 })
    await page.mouse.up()

    // The direction depends on the spring between the circles. The circle must move, which is what "follows" means here.
    await expect
      .poll(async () => {
        const after = await linked.boundingBox()
        return Math.hypot((after?.x ?? 0) - linkedBefore.x, (after?.y ?? 0) - linkedBefore.y)
      })
      .toBeGreaterThan(3)
  })

  test('tamu generate sekali di perangkat, lalu diminta masuk', async ({ page }) => {
    await page.goto('/learning')
    await page.getByRole('button', { name: 'Tambah belajar pertama' }).click()
    const dialog = page.getByRole('dialog', { name: 'Tambah belajar' })
    await dialog.getByLabel('Mau belajar apa?').fill('Aljabar linier SMA')
    await dialog.getByRole('button', { name: 'Generate', exact: true }).click()
    await dialog.getByRole('button', { name: 'Tambah', exact: true }).first().click()

    // The next step: the guest's AI bulat is on the device, so the options ask for an account.
    await expect(page.getByRole('dialog', { name: 'Pola berikutnya' })).toBeVisible()
    await expect(page.getByText('Masuk untuk memakai pilihan ini.').first()).toBeVisible()
    await page.getByRole('button', { name: 'Selesai', exact: true }).click()
    await expect(page.getByRole('dialog')).toBeHidden()
    await expect(page.locator('[data-topic-id][role="button"][aria-label^="Penerapan Aljabar linier SMA"]')).toBeVisible()

    // A second bulat needs an account.
    await page.getByRole('button', { name: 'Tambah belajar', exact: true }).click()
    await expect(page.getByRole('dialog').getByText('Masuk untuk membuat bulat lagi.')).toBeVisible()
    await expect(page.getByRole('dialog').getByLabel('Mau belajar apa?')).toHaveCount(0)
  })
})

test.describe('Materi dan ganti nama', () => {
  test('generate materi satu bagian setiap klik, dan nama diganti dengan tiga klik', async ({ page }) => {
    await page.goto('/learning')
    await topic(page, 'persamaan-linear').focus()
    await page.keyboard.press('Enter')

    const panel = topicChat(page)
    const materi = page.getByRole('region', { name: 'Materi bulat' })
    await panel.getByRole('button', { name: 'Generate materi' }).click()
    await expect(materi.getByRole('heading', { name: 'Bagian 1: Persamaan linear' })).toBeVisible()
    await panel.getByRole('button', { name: 'Generate materi' }).click()
    await expect(materi.getByRole('heading', { name: 'Bagian 2: Persamaan linear' })).toBeVisible()

    await panel.getByRole('heading', { name: 'Persamaan linear', level: 2 }).click({ clickCount: 3 })
    await expect(panel.getByLabel('Nama bulat')).toBeVisible()
  })
})

test.describe('Tambah belajar', () => {
  test('kanvas kosong menampilkan lingkaran tambah, dan bulat dari tujuan lanjut ke langkah berikutnya', async ({ page }) => {
    // The example topics of the account are hidden for the first list answer, so the canvas is empty.
    let answered = false
    await page.route('**/api/topics', async (route) => {
      if (route.request().method() === 'GET' && !answered) {
        answered = true
        await route.fulfill({ json: { topics: [], links: [] } })
        return
      }
      await route.continue()
    })
    await page.goto('/learning')
    await page.getByRole('button', { name: 'Tambah belajar pertama' }).click()
    const dialog = page.getByRole('dialog', { name: 'Tambah belajar' })
    await dialog.getByLabel('Mau belajar apa?').fill('Pecahan')
    await dialog.getByRole('button', { name: 'Generate', exact: true }).click()
    await dialog.getByRole('button', { name: 'Tambah', exact: true }).first().click()

    // The new pattern is on the canvas, and the next step offers AI or a finished pattern.
    await expect(page.getByRole('dialog', { name: 'Pola berikutnya' })).toBeVisible()
    await page.getByRole('button', { name: 'Selesai', exact: true }).click()
    await expect(page.getByRole('dialog')).toBeHidden()
    await expect(page.locator('[data-topic-id][role="button"][aria-label^="Penerapan Pecahan"]')).toBeVisible()
  })
  test('tujuan kosong tidak bisa dikirim', async ({ page }) => {
    await page.goto('/learning')
    await page.getByRole('button', { name: 'Tambah belajar', exact: true }).click()
    const dialog = page.getByRole('dialog', { name: 'Tambah belajar' })
    await expect(dialog.getByRole('button', { name: 'Generate', exact: true })).toBeDisabled()

    await dialog.getByLabel('Mau belajar apa?').fill('   ')
    await expect(dialog.getByRole('button', { name: 'Generate', exact: true })).toBeDisabled()
  })
  test('tamu melihat tombol tambah bulat yang sama dengan akun', async ({ page }) => {
    await page.goto('/chat')
    await signOutFromMenu(page)
    await page.goto('/learning')
    await expect(page.getByRole('button', { name: 'Perbesar papan' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Tambah belajar', exact: true })).toBeVisible()
  })
})
