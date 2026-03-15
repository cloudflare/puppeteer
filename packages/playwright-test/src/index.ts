import { test as baseTest, defineConfig as baseDefineConfig } from '@playwright/test';
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
 * Options for Browser Rendering API configuration.
 */
export type BrowserRenderingOptions = {
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
  acquireBrowserRenderingSession: () => Promise<string>;
  closeBrowserRenderingSession: (sessionId: string) => Promise<void>;
  _browserRenderingBaseURL: string;
  _browserRenderingHeaders: Record<string, string>;
  _connectToBrowser: (sessionId: string) => Promise<Browser>;
  _sessionId: string;
};

type BrowserRenderingTestFixtures = {
  _annotate: void;
};

/**
 * Whether Browser Rendering is enabled. True when both CLOUDFLARE_ACCOUNT_ID / CF_ACCOUNT_ID
 * and CLOUDFLARE_API_TOKEN / CF_API_TOKEN environment variables are set.
 */
export const usesBrowserRendering = !!((process.env.CLOUDFLARE_ACCOUNT_ID || process.env.CF_ACCOUNT_ID) && (process.env.CLOUDFLARE_API_TOKEN || process.env.CF_API_TOKEN));

/**
 * Playwright Test with Browser Rendering fixtures.
 *
 * When CLOUDFLARE_ACCOUNT_ID / CF_ACCOUNT_ID and CLOUDFLARE_API_TOKEN / CF_API_TOKEN
 * environment variables are set, tests run against Cloudflare's Browser Rendering API.
 * Otherwise, tests run locally using Playwright's default browser launch.
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
 * import { defineConfig } from '@cloudflare/browser-playwright-test';
 *
 * export default defineConfig({
 *   use: {
 *     browserRendering: {
 *       sessions: {
 *         keepAlive: 60000,
 *         lab: false,
 *       },
 *     },
 *   },
 * });
 * ```
 */
export const test = !usesBrowserRendering ? baseTest : baseTest.extend<
  BrowserRenderingTestFixtures,
  BrowserRenderingWorkerOptions & BrowserRenderingWorkerFixtures
>({
  browserRendering: [{}, { scope: 'worker', option: true }],

  _browserRenderingBaseURL: [async ({}, use) => {
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID || process.env.CF_ACCOUNT_ID;
    await use(`https://api.cloudflare.com/client/v4/accounts/${accountId}/browser-rendering`);
  }, { scope: 'worker', box: true }],

  _browserRenderingHeaders: [async ({}, use) => {
    await use({
      'Authorization': `Bearer ${process.env.CLOUDFLARE_API_TOKEN || process.env.CF_API_TOKEN}`,
    });
  }, { scope: 'worker', box: true }],

  acquireBrowserRenderingSession: [async ({ _browserRenderingBaseURL, _browserRenderingHeaders, browserRendering }, use) => {
    await use(async () => {
      const sessions = browserRendering?.sessions;
      const params = new URLSearchParams();
      if (sessions?.keepAlive) {
        params.set('keep_alive', sessions.keepAlive.toString());
      }
      if (sessions?.lab) {
        params.set('lab', sessions.lab.toString());
      }
      const retryOptions = sessions?.retry ?? defaultRetryOptions;
      const response = await retry(
        () => fetch(`${_browserRenderingBaseURL}/devtools/browser${params.size > 0 ? '?' + params.toString() : ''}`, {
          method: 'POST',
          headers: {
            ..._browserRenderingHeaders,
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

  closeBrowserRenderingSession: [async ({ _browserRenderingBaseURL, _browserRenderingHeaders }, use) => {
    await use(async (sessionId: string) => {
      const response = await fetch(`${_browserRenderingBaseURL}/devtools/browser/${sessionId}`, {
        method: 'DELETE',
        headers: _browserRenderingHeaders,
      });

      if (!response.ok)
        throw new Error(`Failed to close browser session: ${response.status} ${response.statusText}`);
    });
  }, { scope: 'worker', box: true }],

  _connectToBrowser: [async ({ _browserRenderingBaseURL, _browserRenderingHeaders, playwright }, use) => {
    await use(async (sessionId: string) => {
      const wsEndpoint = _browserRenderingBaseURL.replace('https://', 'wss://') + `/devtools/browser/${sessionId}`;
      return playwright.chromium.connectOverCDP(wsEndpoint, {
        headers: _browserRenderingHeaders,
      });
    });
  }, { scope: 'worker', box: true }],

  _sessionId: [async ({ acquireBrowserRenderingSession, closeBrowserRenderingSession }, use) => {
    const sessionId = await acquireBrowserRenderingSession();
    await use(sessionId);
    await closeBrowserRenderingSession(sessionId);
  }, { scope: 'worker', box: true }],

  browser: [async ({ _sessionId, _connectToBrowser }, use) => {
    const browser = await _connectToBrowser(_sessionId);
    await use(browser);
    await browser.close();
  }, { scope: 'worker' }],

  _annotate: [async ({ browser, _sessionId, browserRendering }, use, testInfo) => {
    if (browserRendering?.annotations !== 'off') {
      const labAnnotation = browserRendering?.sessions?.lab ? [{ type: 'browser-rendering-lab', description: 'true' }] : [];
      testInfo.annotations.push(
        { type: 'browser-rendering-session-id', description: _sessionId },
        { type: 'browser-rendering-version', description: browser.version() },
        ...labAnnotation,
      );
    }
    await use();
  }, { auto: true, box: true }],
});
