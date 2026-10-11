import { createApp } from './app.js'
import { config } from './config/index.js'
import { logger } from './logger.js'

const app = createApp({ corsOrigin: config.CORS_ORIGIN })
app.listen(config.PORT, () => {
  logger.info(`Backend berjalan di http://localhost:${config.PORT}`)
})
