import { test as baseTest, chromium } from '@playwright/test';
import type { Browser } from '@playwright/test';

import { retry, defaultRetryOptions } from './retry.js';
import type { RetryOptions } from './retry.js';

export { expect } from '@playwright/test';
export type { RetryOptions } from './retry.js';

/**
 * Cloudflare API credentials for Browser Rendering.
 */
export type CloudflareCredentials = {
  /** Cloudflare account ID (by default read from CLOUDFLARE_ACCOUNT_ID environment variable) */
  accountId: string;
  /** Cloudflare API token (by default read from CLOUDFLARE_API_TOKEN environment variable) */
  apiToken: string;
};

/**
 * Worker-scoped options that can be configured in playwright.config.ts
 */
export type BrowserRenderingWorkerOptions = {
  /** Base URL for Browser Rendering API */
  browserRenderingBaseURL: string;
  /** HTTP headers for API authentication */
  browserRenderingHeaders: Record<string, string>;
  /** Cloudflare credentials (accountId and apiToken) */
  cloudflareCredentials: CloudflareCredentials;
  /** Retry options for 429 responses */
  retryOptions: RetryOptions;
};

type SessionInfo = {
  sessionId: string;
};

type BrowserRenderingWorkerFixtures = {
  acquireSession: () => Promise<string>;
  closeSession: (sessionId: string) => Promise<void>;
  connectToBrowser: (sessionId: string) => Promise<Browser>;
  sessionId: string;
};

/**
 * Playwright Test with Browser Rendering fixtures.
 *
 * @example
 * ```typescript
 * import { test, expect } from '@cloudflare/browser-playwright-test';
 *
 * test('example test', async ({ page }) => {
 *   await page.goto('https://example.com');
 *   await expect(page).toHaveTitle('Example Domain');
 * });
 * ```
 *
 * @example Configure in playwright.config.ts
 * ```typescript
 * import { defineConfig } from '@playwright/test';
 *
 * export default defineConfig({
 *   use: {
 *     cloudflareCredentials: {
 *       accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
 *       apiToken: process.env.CLOUDFLARE_API_TOKEN,
 *     },
 *   },
 * });
 * ```
 */
export const test = baseTest.extend<
  {},
  BrowserRenderingWorkerOptions & BrowserRenderingWorkerFixtures
>({
  cloudflareCredentials: [async ({}, use) => {
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    const apiToken = process.env.CLOUDFLARE_API_TOKEN;
    if (!accountId || !apiToken)
      throw new Error('CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN environment variables are required');
    await use({ accountId, apiToken });
  }, { scope: 'worker', option: true }],

  retryOptions: [defaultRetryOptions, { scope: 'worker', option: true }],

  browserRenderingBaseURL: [async ({ cloudflareCredentials }, use) => {
    await use(`https://api.cloudflare.com/client/v4/accounts/${cloudflareCredentials.accountId}/browser-rendering`);
  }, { scope: 'worker', option: true }],

  browserRenderingHeaders: [async ({ cloudflareCredentials }, use) => {
    await use({
      'Authorization': `Bearer ${cloudflareCredentials.apiToken}`,
    });
  }, { scope: 'worker', option: true }],

  acquireSession: [async ({ browserRenderingBaseURL, browserRenderingHeaders, retryOptions }, use) => {
    await use(async () => {
      const response = await retry(
        () => fetch(`${browserRenderingBaseURL}/devtools/browser`, {
          method: 'POST',
          headers: {
            ...browserRenderingHeaders,
            'Content-Type': 'application/json',
          },
        }),
        retryOptions
      );

      if (!response.ok)
        throw new Error(`Failed to create browser session: ${response.status} ${response.statusText}`);

      const data = await response.json() as SessionInfo;
      return data.sessionId;
    });
  }, { scope: 'worker' }],

  closeSession: [async ({ browserRenderingBaseURL, browserRenderingHeaders }, use) => {
    await use(async (sessionId: string) => {
      const response = await fetch(`${browserRenderingBaseURL}/devtools/browser/${sessionId}`, {
        method: 'DELETE',
        headers: browserRenderingHeaders,
      });

      if (!response.ok)
        throw new Error(`Failed to close browser session: ${response.status} ${response.statusText}`);
    });
  }, { scope: 'worker' }],

  connectToBrowser: [async ({ browserRenderingBaseURL, browserRenderingHeaders }, use) => {
    await use(async (sessionId: string) => {
      const wsEndpoint = browserRenderingBaseURL.replace('https://', 'wss://') + `/devtools/browser/${sessionId}`;
      return chromium.connectOverCDP(wsEndpoint, {
        headers: browserRenderingHeaders,
      });
    });
  }, { scope: 'worker' }],

  sessionId: [async ({ acquireSession, closeSession }, use, workerInfo) => {
    const sessionId = await acquireSession();
    await use(sessionId);
    await closeSession(sessionId);
  }, { scope: 'worker' }],

  browser: [async ({ sessionId, connectToBrowser }, use) => {
    const browser = await connectToBrowser(sessionId);
    await use(browser);
    await browser.close();
  }, { scope: 'worker' }],
});
