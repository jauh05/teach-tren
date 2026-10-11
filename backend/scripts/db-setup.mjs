// Creates the tables in the development database and in the test database. Run it once after db:start, and after pulling new migrations.
// Usage: npm run db:setup
import { spawnSync } from 'node:child_process'

try {
  process.loadEnvFile('.env')
} catch {
  console.error('Berkas backend/.env tidak ada. Salin dari .env.example dulu.')
  process.exit(1)
}

const targets = [
  ['DATABASE_URL', process.env.DATABASE_URL],
  ['TEST_DATABASE_URL', process.env.TEST_DATABASE_URL],
]
for (const [name, url] of targets) {
  if (!url) {
    console.error(`${name} belum diisi di backend/.env.`)
    process.exit(1)
  }
  console.log(`Migrasi ${name} ...`)
  const result = spawnSync('npx', ['prisma', 'migrate', 'deploy'], { stdio: 'inherit', env: { ...process.env, DATABASE_URL: url } })
  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}
console.log('Selesai.')
