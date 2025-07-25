import { defineConfig } from '@playwright/test';

import type { WorkerOptions } from './src/proxy/proxyTests.js';

export default defineConfig<object, WorkerOptions>({
  testDir: './proxyTests',
  reporter: process.env.CI ? 'dot' : 'list',
  // dev mode apparently doesn't support parallelism
  workers: process.env.TESTS_SERVER_URL ? 6 : 1,
  retries: process.env.TESTS_SERVER_URL ? 1 : 0,
  timeout: 60 * 1000,
  projects: [
    {
      name: 'BISO',
      use: {
        binding: 'BROWSER',
      }
    },
    {
      name: 'BRAPI Staging',
      use: {
        binding: 'BROWSER_BRAPI_STAGING',
      }
    },
    {
      name: 'BRAPI Production',
      use: {
        binding: 'BROWSER_BRAPI_PRODUCTION',
      }
    },
  ]
});
