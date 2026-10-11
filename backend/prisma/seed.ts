import { prisma } from '../src/db.js'
import { hashPassword } from '../src/auth/password.js'
import { seedDefaultTopics } from '../src/topics/defaultGraph.js'

// Creates one demo account when DEMO_EMAIL and DEMO_PASSWORD are set. No credentials are stored in the repo.
const email = process.env.DEMO_EMAIL?.trim().toLowerCase()
const password = process.env.DEMO_PASSWORD

if (!email || !password) {
  console.log('Lewati seed: isi DEMO_EMAIL dan DEMO_PASSWORD untuk membuat akun demo.')
} else {
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    console.log('Akun demo sudah ada.')
  } else {
    const passwordHash = await hashPassword(password)
    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({ data: { name: 'Akun Demo', email, passwordHash } })
      await seedDefaultTopics(tx, user.id)
    })
    console.log(`Akun demo dibuat: ${email}`)
  }
}

await prisma.$disconnect()
