import { defineConfig } from '@playwright/test'

const PORT = 5173
const API_PORT = 3001
const baseURL = `http://localhost:${PORT}`

// The end-to-end tests run against a real backend on a separate test database (backend/.env, TEST_DATABASE_URL).
// Their settings come from the backend's .env file, and the database name must end with _test.
process.loadEnvFile('../backend/.env')
const testDatabaseUrl = process.env.TEST_DATABASE_URL ?? ''
if (!/_test(\?|$)/.test(testDatabaseUrl)) {
  throw new Error('TEST_DATABASE_URL di backend/.env wajib diisi dan namanya berakhiran _test.')
}

// Two projects matching the design reference: desktop 1280px and mobile 390px (docs/role.md section 3).
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'desktop',
      use: { viewport: { width: 1280, height: 800 } },
    },
    {
      name: 'mobile',
      use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true },
    },
  ],
  webServer: [
    {
      command: `npm run dev -- --port ${PORT} --strictPort`,
      url: baseURL,
      reuseExistingServer: !process.env.CI,
      env: { API_PROXY_TARGET: `http://localhost:${API_PORT}` },
    },
    {
      // Always a fresh backend on the test database, so it never touches development data.
      command: 'npm run e2e:server',
      cwd: '../backend',
      url: `http://localhost:${API_PORT}/api/health`,
      reuseExistingServer: false,
      env: {
        DATABASE_URL: testDatabaseUrl,
        JWT_SECRET: process.env.JWT_SECRET ?? '',
        NODE_ENV: 'test',
        PORT: String(API_PORT),
        CORS_ORIGIN: baseURL,
        LOG_LEVEL: 'silent',
      },
    },
  ],
})
