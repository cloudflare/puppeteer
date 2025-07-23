import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './proxyTests',
  reporter: process.env.CI ? 'dot' : 'list',
  // dev mode apparently doesn't support parallelism
  workers: process.env.TESTS_SERVER_URL ? 6 : 1,
  retries: process.env.TESTS_SERVER_URL ? 1 : 0,
  timeout: 60 * 1000,
  projects: [
    {
      name: 'workers',
    },
  ]
});
