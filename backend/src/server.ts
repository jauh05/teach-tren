import { createApp } from './app.js'
import { config } from './config/index.js'
import { logger } from './logger.js'
import { startCleanupJob } from './jobs/cleanup.js'

const app = createApp({ corsOrigin: config.CORS_ORIGIN })
const server = app.listen(config.PORT, () => {
  logger.info(`Backend berjalan di http://localhost:${config.PORT}`)
})
// Also limits the time a request may take to arrive, so slow clients cannot hold connections.
server.requestTimeout = config.REQUEST_TIMEOUT_MS
startCleanupJob()
