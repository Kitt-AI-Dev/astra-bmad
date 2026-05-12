import { defineConfig, devices } from '@playwright/test'

// Load env vars so test-side code (e.g. Supabase admin client) has access to them
try { process.loadEnvFile('.env') } catch { /* file absent in CI — env vars injected externally */ }

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
