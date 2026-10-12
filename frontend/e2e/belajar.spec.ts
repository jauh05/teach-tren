import { expect, test, type Page } from './fixtures'
import { expectNoHorizontalScroll } from './helpers'

// A new account has no learning plan, so it has no example topics either. Learning asks for the plan first.
test.describe('Rencana belajar', () => {
  test.use({ asGuest: true })

  // The page's own request context shares the session cookie with the browser page, so the page starts signed in.
  async function registerNewAccount(page: Page, account: { email: string; password: string }) {
    const registered = await page.context().request.post('/api/auth/register', {
      data: { name: 'Rani Putri', email: account.email, password: account.password },
    })
    expect(registered.ok()).toBeTruthy()
    await page.goto('/learning')
  }

  // The branches list shown after the roadmap is made.
  function roadmapList(page: Page) {
    return page.getByRole('list', { name: 'Cabang roadmap' })
  }

  test('akun baru diminta memilih rencana sebelum Learning dibuka', async ({ page, account }, testInfo) => {
    await registerNewAccount(page, account)
    await expect(page).toHaveURL(/\/belajar\/mulai$/)
    if (testInfo.project.name !== 'desktop') {
      await expectNoHorizontalScroll(page)
    }

    await page.getByRole('radio', { name: 'SD' }).click()
    await page.getByRole('radio', { name: 'Kelas 4' }).click()
    await page.getByRole('button', { name: 'Lanjut' }).click()
    await page.getByRole('button', { name: 'Matematika' }).click()
    await page.getByRole('button', { name: 'Lanjut' }).click()
    await page.getByRole('button', { name: 'Buat roadmap' }).click()
    await expect(roadmapList(page).getByRole('listitem').first()).toBeVisible()
    await page.getByRole('button', { name: 'Simpan roadmap' }).click()

    await expect(page).toHaveURL(/\/learning$/)
    // The first branch is on the canvas, as a topic of the roadmap. Each topic is a button named after it.
    await expect(page.getByRole('button', { name: /^Bilangan cacah/ })).toBeVisible()
  })

  test('roadmap bisa dibuat ulang sebelum disimpan', async ({ page, account }) => {
    await registerNewAccount(page, account)
    await page.getByRole('radio', { name: 'SMP' }).click()
    await page.getByRole('radio', { name: 'Kelas 7' }).click()
    await page.getByRole('button', { name: 'Lanjut' }).click()
    await page.getByRole('button', { name: 'IPS' }).click()
    await page.getByRole('button', { name: 'Lanjut' }).click()
    await page.getByRole('button', { name: 'Buat roadmap' }).click()
    await expect(roadmapList(page)).toBeVisible()

    await page.getByRole('button', { name: 'Buat ulang roadmap' }).click()
    await expect(roadmapList(page)).toBeVisible()
    // Nothing is saved yet, so the page is still the wizard.
    await expect(page).toHaveURL(/\/belajar\/mulai$/)
  })

  test('rencana yang sudah ada langsung membuka Learning', async ({ page, account }) => {
    await registerNewAccount(page, account)
    await page.getByRole('radio', { name: 'SMA' }).click()
    await page.getByRole('radio', { name: 'Kelas 10' }).click()
    await page.getByRole('button', { name: 'Lanjut' }).click()
    await page.getByRole('button', { name: 'Fisika' }).click()
    await page.getByRole('button', { name: 'Lanjut' }).click()
    await page.getByRole('button', { name: 'Buat roadmap' }).click()
    await expect(roadmapList(page)).toBeVisible()
    await page.getByRole('button', { name: 'Simpan roadmap' }).click()
    await expect(page).toHaveURL(/\/learning$/)

    await page.goto('/belajar/mulai')
    await expect(page).toHaveURL(/\/learning$/)
  })

  test('materi bisa ditulis sendiri, lalu disimpan ke Learning', async ({ page, account }) => {
    await registerNewAccount(page, account)
    await page.getByRole('radio', { name: 'SD' }).click()
    await page.getByRole('radio', { name: 'Kelas 2' }).click()
    await page.getByRole('button', { name: 'Lanjut' }).click()
    await page.getByRole('button', { name: 'Matematika' }).click()
    await page.getByRole('button', { name: 'Lanjut' }).click()
    await page.getByRole('button', { name: 'Isi materi sendiri' }).click()

    for (const name of ['Penjumlahan', 'Pengurangan', 'Perkalian', 'Pembagian', 'Pecahan', 'Bangun datar']) {
      await page.getByLabel('Nama cabang baru').fill(name)
      await page.getByRole('button', { name: 'Tambah', exact: true }).click()
    }
    await expect(page.getByLabel('Nama cabang 6')).toHaveValue('Bangun datar')
    await page.getByRole('button', { name: 'Simpan roadmap' }).click()

    await expect(page).toHaveURL(/\/learning$/)
    await expect(page.getByRole('button', { name: /^Penjumlahan/ })).toBeVisible()
  })

  test('akun baru yang daftar langsung diminta rencana belajar, di halaman mana pun', async ({ page, account }) => {
    await page.goto('/daftar')
    await page.getByLabel('Nama').fill('Rani Putri')
    await page.getByLabel('Email').fill(account.email)
    await page.getByLabel('Kata sandi').fill(account.password)
    await page.getByRole('button', { name: 'Buat akun' }).click()

    // Signing up lands on the chat by default, but the wizard comes first.
    await expect(page).toHaveURL(/\/belajar\/mulai$/)
    await page.goto('/chat')
    await expect(page).toHaveURL(/\/belajar\/mulai$/)
  })
})

