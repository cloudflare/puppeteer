import { test as baseTest } from '@playwright/test';
import { browserSessionFixture, proxyTests } from '@cloudflare/browser-test-runtime/proxy';

import type { BrowserBindingName } from '../utils';

export type WorkerFixture = {
  sessionId: string;
};
export interface WorkerOptions {
  binding: BrowserBindingName;
}

export const test = baseTest.extend<{}, WorkerFixture & WorkerOptions>({
  binding: ['BROWSER', { option: true, scope: 'worker' }],
  sessionId: [browserSessionFixture, { scope: 'worker' }],
});

export { proxyTests };
