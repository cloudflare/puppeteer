import {
  TestRunner,
  setUnderTest,
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
} from '@cloudflare/playwright/internal';
import '@workerTests/index';
import puppeteer from '@cloudflare/puppeteer';
import {DurableObject} from 'cloudflare:workers';

import {skipTests} from '../skipTests.js';

import {setTestState, TestServer} from './mocha-utils.js';
import { getBinding } from './utils.js';

export interface TestRequestPayload {
  testId: string;
  fullTitle: string;
  timeout: number;
}

const log = console.log.bind(console);

const skipTestsFullTitles = new Set(
  skipTests.map(t => {
    return t.join(' > ');
  }),
);

// ensure we are in test mode
setUnderTest(true);

export class TestsServer extends DurableObject<Env> {
  constructor(state: DurableObjectState, env: Env) {
    super(state, env);
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const file = url.pathname.substring(1);
    const sessionId = url.searchParams.get('sessionId');
    if (!sessionId) {
      return new Response('sessionId is required', {status: 400});
    }
    const timeout =
      parseInt(url.searchParams.get('timeout') ?? '10', 10) * 1000;
    const {testId, fullTitle} = (await request.json()) as TestRequestPayload;
    const assetsUrl = url.origin;
    const {env} = this;
    const testRunner = new TestRunner({env, sessionId, assetsUrl}, {timeout});
    if (skipTestsFullTitles.has(fullTitle)) {
      log(`🚫 Skipping ${fullTitle}`);
      return Response.json({
        testId,
        status: 'skipped',
        errors: [],
        annotations: [],
        duration: 0,
        hasNonRetriableError: false,
        timeout,
        expectedStatus: 'skipped',
      });
    }

    log(`🧪 Running ${fullTitle}`);

    // TODO __dirname is used to access local files, mabe we can polyfill that too?
    (globalThis as any).__dirname = '';

    const binding = getBinding(url);
    const browser = await puppeteer.connect(binding, sessionId);
    try {
      const page = await browser.newPage();
      setTestState({
        page,
        server: new TestServer(url.origin),
      });

      const result = await testRunner.runTest(file, testId);
      if (!['passed', 'skipped'].includes(result.status)) {
        log(
          `❌ ${fullTitle} failed with status ${result.status}${result.errors.length ? `: ${result.errors[0].message}` : ''}`,
        );
      }
      return Response.json(result);
    } finally {
      setTestState(undefined);
      await browser.disconnect();
    }
  }
}
