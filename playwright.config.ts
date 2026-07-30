import { defineConfig, devices } from '@playwright/test'

/**
 * E2E tests run against a real `next dev` server pointed at the same
 * Supabase project as production — there is no separate staging
 * environment for this single-tenant app. Every test that creates data
 * must clean up after itself (see e2e/helpers/cleanup.ts) so repeated runs
 * don't accumulate synthetic clients/appointments in the real database.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 60_000,
  },
})
