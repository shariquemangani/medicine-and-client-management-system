import { defineConfig, devices } from '@playwright/test'
import { loadEnvConfig } from '@next/env'

// Pick up TEST_USER_EMAIL / TEST_USER_PASSWORD from .env.local (test Firebase project only).
loadEnvConfig(process.cwd())

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000'

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list']],
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'setup', testMatch: /auth\.setup\.ts/ },
    {
      name: 'public',
      testMatch: /public\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'desktop',
      testMatch: /(app|stock)\.spec\.ts/,
      dependencies: ['setup'],
      use: { ...devices['Desktop Chrome'], storageState: 'tests/.auth/state.json' },
    },
    {
      name: 'mobile',
      testMatch: /app\.spec\.ts/,
      dependencies: ['setup'],
      use: { ...devices['Pixel 7'], storageState: 'tests/.auth/state.json' },
    },
  ],
  // Start the production server automatically: PLAYWRIGHT_START_SERVER=1 npx playwright test
  webServer: process.env.PLAYWRIGHT_START_SERVER
    ? { command: 'npm run start', url: baseURL, reuseExistingServer: true, timeout: 120_000 }
    : undefined,
})
