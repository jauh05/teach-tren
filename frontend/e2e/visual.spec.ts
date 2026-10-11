import { mkdirSync } from 'node:fs'
import path from 'node:path'
import { test } from './fixtures'
import { visibleOnly } from './helpers'

// CC-11 visual check. Each screen is captured here, and the matching mockup from docs/design/html is captured at the same size.
// Both go to test-results/visual. scripts/visual-compare.py compares them and writes docs/visual-report.md.
const MOCKUP_DIR = path.resolve('..', 'docs', 'design', 'html')
const OUT_DIR = path.resolve('test-results', 'visual')

// The mockups are drawn at 1440 px on desktop (docs/role.md CC-11). The desktop project uses 1280 px for the other tests.
const DESKTOP_WIDTH = 1440
const DESKTOP_HEIGHT = 900

const SCREENS = [
  { name: '01-chat-beranda', url: '/chat' },
  { name: '02-learning', url: '/learning' },
  { name: '03-chat-jawaban', url: '/c/persamaan-linear' },
  { name: '04-kuis-soal', url: '/kuis/persamaan-linear' },
  { name: '05-jadwal', url: '/jadwal' },
  { name: '07-pengaturan', url: '/pengaturan' },
]

mkdirSync(OUT_DIR, { recursive: true })

for (const screen of SCREENS) {
  test(`tangkapan ${screen.name}`, async ({ page }, testInfo) => {
    const device = testInfo.project.name
    if (device === 'desktop') {
      await page.setViewportSize({ width: DESKTOP_WIDTH, height: DESKTOP_HEIGHT })
    }
    await page.goto(screen.url)
    await page.waitForLoadState('networkidle')
    await page.screenshot({ path: path.join(OUT_DIR, `${screen.name}-${device}.png`) })

    await page.goto(`file://${path.join(MOCKUP_DIR, `${screen.name}-${device}.html`)}`)
    await page.waitForLoadState('load')
    await page.screenshot({ path: path.join(OUT_DIR, `mockup-${screen.name}-${device}.png`) })
  })
}

test.describe('tangkapan tamu', () => {
  test.use({ asGuest: true })

  test('06-tamu-batas', async ({ page }, testInfo) => {
    const device = testInfo.project.name
    if (device === 'desktop') {
      await page.setViewportSize({ width: DESKTOP_WIDTH, height: DESKTOP_HEIGHT })
    }
    // Two answers use up the guest quota, then the composer locks and the sign-up prompt shows.
    await page.goto('/c/persamaan-linear')
    const input = page.getByRole('textbox', { name: 'Tulis pertanyaan' })
    for (const question of ['Apa itu fotosintesis?', 'Jelaskan lagi dengan singkat.']) {
      await input.fill(question)
      await input.press('Enter')
      await page.waitForLoadState('networkidle')
      await visibleOnly(page.getByRole('button', { name: 'Kirim pesan' }).or(page.getByText('Untuk lanjut, daftar atau masuk dulu.'))).waitFor({ timeout: 15_000 })
    }
    await page.screenshot({ path: path.join(OUT_DIR, `06-tamu-batas-${device}.png`) })

    await page.goto(`file://${path.join(MOCKUP_DIR, `06-tamu-batas-${device}.html`)}`)
    await page.waitForLoadState('load')
    await page.screenshot({ path: path.join(OUT_DIR, `mockup-06-tamu-batas-${device}.png`) })
  })
})
