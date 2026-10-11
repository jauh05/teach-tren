import 'dotenv/config'
import { defineConfig } from 'vitest/config'

// Tests use their own database (TEST_DATABASE_URL) and never the development one.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/**/*.test.ts'],
    // All files share one database, so they run one after another.
    fileParallelism: false,
    env: {
      NODE_ENV: 'test',
      LOG_LEVEL: 'silent',
      DATABASE_URL: process.env.TEST_DATABASE_URL ?? '',
      JWT_SECRET: 'rahasia-uji-minimal-32-karakter-untuk-test',
      CORS_ORIGIN: 'http://localhost:5173',
      MATERI_PROCESSING_MS: '50',
      AI_MODE: 'mock',
    },
  },
})
