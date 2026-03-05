import { test as baseTest, chromium, defineConfig as baseDefineConfig } from '@playwright/test';
import type { Browser, PlaywrightTestConfig } from '@playwright/test';

import { retry, defaultRetryOptions } from './retry.js';
import type { RetryOptions } from './retry.js';

export { expect } from '@playwright/test';
export type { RetryOptions } from './retry.js';

/**
 * Define Playwright Test configuration with Browser Rendering support.
 *
 * @example
 * ```typescript
 * import { defineConfig } from '@cloudflare/browser-playwright-test';
 *
 * export default defineConfig({
 *   use: {
 *     browserRendering: {
 *       credentials: {
 *         accountId: process.env.CLOUDFLARE_ACCOUNT_ID!,
 *         apiToken: process.env.CLOUDFLARE_API_TOKEN!,
 *       },
 *       sessions: {
 *         keepAlive: 120_000,
 *         retry: {
 *           maxRetries: 3,
 *         },
 *       },
 *     },
 *   },
 * });
 * ```
 */
export function defineConfig<T extends {}, W extends BrowserRenderingWorkerOptions>(config: PlaywrightTestConfig<T, W>): PlaywrightTestConfig<T, W> {
  return baseDefineConfig<T, W>(config);
}

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
 * Options for Browser Rendering API configuration.
 */
export type BrowserRenderingOptions = {
  /** Cloudflare credentials (defaults to CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN env vars) */
  credentials?: CloudflareCredentials;
  /** Session options */
  sessions?: {
    /** Keep-alive timeout in ms (default: 60000) */
    keepAlive?: number;
    /** Use lab environment (default: false) */
    lab?: boolean;
    /** Retry options for 429 responses */
    retry?: RetryOptions;
  };
  /** Whether to add annotations to test results (default: 'on') */
  annotations?: 'on' | 'off';
};

/**
 * Worker-scoped options that can be configured in playwright.config.ts
 */
export type BrowserRenderingWorkerOptions = {
  /** Browser Rendering API configuration */
  browserRendering?: BrowserRenderingOptions;
};

type SessionInfo = {
  sessionId: string;
};

type BrowserRenderingWorkerFixtures = {
  browserRenderingBaseURL: string;
  browserRenderingHeaders: Record<string, string>;
  acquireSession: () => Promise<string>;
  closeSession: (sessionId: string) => Promise<void>;
  connectToBrowser: (sessionId: string) => Promise<Browser>;
  sessionId: string;
};

type BrowserRenderingTestFixtures = {
  _annotate: void;
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
 *     browserRendering: {
 *       credentials: {
 *         accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
 *         apiToken: process.env.CLOUDFLARE_API_TOKEN,
 *       },
 *       sessions: {
 *         keepAlive: 60000,
 *         lab: false,
 *       },
 *     },
 *   },
 * });
 * ```
 */
export const test = baseTest.extend<
  BrowserRenderingTestFixtures,
  BrowserRenderingWorkerOptions & BrowserRenderingWorkerFixtures
>({
  browserRendering: [{}, { scope: 'worker', option: true }],

  browserRenderingBaseURL: [async ({ browserRendering }, use) => {
    const accountId = browserRendering?.credentials?.accountId ?? process.env.CLOUDFLARE_ACCOUNT_ID;
    if (!accountId)
      throw new Error('Cloudflare account ID is required. Set browserRendering.credentials.accountId or CLOUDFLARE_ACCOUNT_ID environment variable.');
    await use(`https://api.cloudflare.com/client/v4/accounts/${accountId}/browser-rendering`);
  }, { scope: 'worker' }],

  browserRenderingHeaders: [async ({ browserRendering }, use) => {
    const apiToken = browserRendering?.credentials?.apiToken ?? process.env.CLOUDFLARE_API_TOKEN;
    if (!apiToken)
      throw new Error('Cloudflare API token is required. Set browserRendering.credentials.apiToken or CLOUDFLARE_API_TOKEN environment variable.');
    await use({
      'Authorization': `Bearer ${apiToken}`,
    });
  }, { scope: 'worker' }],

  acquireSession: [async ({ browserRenderingBaseURL, browserRenderingHeaders, browserRendering }, use) => {
    await use(async () => {
      const sessions = browserRendering?.sessions;
      const body = {
        keep_alive: sessions?.keepAlive ?? 60000,
        lab: sessions?.lab ?? false,
      };
      const retryOptions = sessions?.retry ?? defaultRetryOptions;
      const response = await retry(
        () => fetch(`${browserRenderingBaseURL}/devtools/browser`, {
          body: JSON.stringify(body),
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

  _annotate: [async ({ browser, sessionId, browserRendering }, use, testInfo) => {
    if (browserRendering?.annotations === 'on') {
      const labAnnotation = browserRendering?.sessions?.lab ? [{ type: 'browser-rendering-lab', description: 'true' }] : [];
      testInfo.annotations.push(
        { type: 'browser-rendering-session-id', description: sessionId },
        { type: 'browser-rendering-version', description: browser.version() },
        ...labAnnotation,
      );
    }
    await use();
  }, { auto: true }],
});
