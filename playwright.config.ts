import { defineConfig } from '@playwright/test';

const baseURL = 'http://localhost:5173';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['github'], ['list']] : 'list',
  use: {
    baseURL,
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'NEXT_PUBLIC_GOOGLE_CLIENT_ID=test-google-client-id npm run dev:fast',
    url: `${baseURL}/login`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
