import { defineConfig } from '@cloudflare/browser-playwright-test';

export default defineConfig({
  testDir: './tests',
  workers: 2,
  use: {
    browserRendering: {
      sessions: {
        keepAlive: 120_000,
      },
    },
  },
});
