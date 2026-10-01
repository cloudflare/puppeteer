import {
  browserSessionFixture,
  proxyTests,
} from '@cloudflare/browser-test-runtime/proxy';
import {test as baseTest} from '@playwright/test';

export interface WorkerOptions {
  binding: 'BROWSER' | 'BROWSER_BRAPI_STAGING' | 'BROWSER_BRAPI_PRODUCTION';
}

export interface WorkerFixture {
  sessionId: string;
}

export const test = baseTest.extend<object, WorkerOptions & WorkerFixture>({
  binding: ['BROWSER', {option: true, scope: 'worker'}],
  sessionId: [browserSessionFixture, {scope: 'worker'}],
});

export {proxyTests};
