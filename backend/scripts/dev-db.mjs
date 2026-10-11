// Runs a local PostgreSQL for development, without Docker or Homebrew. The data is kept in backend/.dev-db (not in git).
// Usage: npm run db:start   (keep it running in its own terminal, stop it with Ctrl+C)
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import EmbeddedPostgres from 'embedded-postgres'

const here = path.dirname(fileURLToPath(import.meta.url))
const databaseDir = path.resolve(here, '..', '.dev-db', 'data')
const user = process.env.DEV_DB_USER ?? 'postgres'
const password = process.env.DEV_DB_PASSWORD ?? 'devpass'
const port = Number(process.env.DEV_DB_PORT ?? 5432)

const server = new EmbeddedPostgres({ databaseDir, user, password, port, persistent: true, onLog: () => {}, onError: () => {} })

if (!existsSync(path.join(databaseDir, 'PG_VERSION'))) {
  console.log('Membuat database baru di backend/.dev-db ...')
  await server.initialise()
}
await server.start()
for (const name of ['teach_tren', 'teach_tren_test']) {
  try {
    await server.createDatabase(name)
  } catch {
    // The database already exists.
  }
}
console.log(`PostgreSQL siap di localhost:${port} (database teach_tren dan teach_tren_test). Tekan Ctrl+C untuk berhenti.`)

async function stop() {
  await server.stop()
  process.exit(0)
}
process.on('SIGINT', stop)
process.on('SIGTERM', stop)
setInterval(() => {}, 1 << 30)
