import { expect, test, type Page } from './fixtures'

const PAGES = ['/chat', '/learning', '/jadwal', '/materi', '/pengaturan', '/tentang', '/kuis/persamaan-linear', '/c/persamaan-linear']

// Loads the main pages and collects what the browser reports as a problem: console errors, uncaught exceptions,
// and failed answers from the server. A guest's 401 on /api/auth is the expected "not signed in" answer, so it is allowed.
async function loadPages(page: Page, allowGuestAuth: boolean): Promise<string[]> {
  const problems: string[] = []
  page.on('console', (message) => {
    // The browser logs every failed request with its status. Guest 401s are checked through the response below.
    if (message.type() === 'error' && !(allowGuestAuth && message.text().includes('status of 401'))) {
      problems.push(`console: ${message.text().slice(0, 200)}`)
    }
  })
  page.on('pageerror', (error) => problems.push(`exception: ${error.message.slice(0, 200)}`))
  page.on('response', (response) => {
    const { pathname } = new URL(response.url())
    if (response.status() >= 400 && !(allowGuestAuth && response.status() === 401 && pathname.startsWith('/api/auth/'))) {
      problems.push(`${response.status()} ${response.request().method()} ${pathname}`)
    }
  })
  for (const path of PAGES) {
    await page.goto(path)
    await page.waitForLoadState('networkidle')
  }
  return problems
}

test.describe('Konsol halaman utama', () => {
  test('akun masuk tidak menerima error konsol atau jawaban gagal', async ({ page }) => {
    expect(await loadPages(page, false)).toEqual([])
  })
})

test.describe('Konsol halaman utama untuk tamu', () => {
  test.use({ asGuest: true })

  test('tamu hanya melihat 401 dari /api/auth yang memang diharapkan', async ({ page }) => {
    expect(await loadPages(page, true)).toEqual([])
  })
})
