// playwright.config.ts - Playwright test configuration
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.ts',
  timeout: 30_000,
  workers: 1,
  retries: 0,
  webServer: {
    command: 'node tests/static-server.cjs',
    url: 'http://127.0.0.1:3001',
    reuseExistingServer: true,
    timeout: 10_000,
  },
  use: {
    baseURL: 'http://127.0.0.1:3001',
    headless: true,
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
    video: 'off',
  },
});
