import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  retries: 1,
  use: {
    baseURL: 'http://localhost:5173',
    headless: true,
    viewport: { width: 1280, height: 720 },
  },
  webServer: [
    {
      command: 'npx vite --port 5173',
      port: 5173,
      reuseExistingServer: !process.env.CI,
      timeout: 15000,
    },
    {
      command: 'node src/server.js',
      port: 3001,
      cwd: '../backend',
      reuseExistingServer: !process.env.CI,
      timeout: 10000,
    },
  ],
});
