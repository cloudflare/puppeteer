import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './src',
  testMatch: '**/*.test.ts',
});
