import { defineConfig } from '@cloudflare/browser-playwright-test';

export default defineConfig({
  testDir: './tests',
  use: {
    browserRendering: {
      sessions: {
        keepAlive: 60_000,
        lab: false,
      },
    },
  },
});
