import {Suite} from 'playwright/lib/common/test';

export const rootSuites: Suite[] = [];

export const playwrightTestConfig = {
  projects: [
    {
      timeout: 5000,
      name: 'chromium',
      outputDir: '/tmp/test-results',
      testDir: '/bundle',
    },
  ],
};

export const configLocation = {
  resolvedConfigFile: '/bundle/playwright.config.ts',
  configDir: '/bundle',
};
