import {
  TestRunner,
  setUnderTest,
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
} from '@cloudflare/playwright/internal';
import '@workerTests/index';
import type { Browser} from '@cloudflare/puppeteer';
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

function parseTrace(trace: string) {
  return Object.fromEntries(trace.split('\n').filter(line => {return line;}).map(line => {
    const [key, value] = line.split('=');
    return [key, value];
  })) as { loc: string, colo: string };
}

interface CdnTrace {
  loc: string;
  colo: string;
}

export class TestsServer extends DurableObject<Env> {
  private cdnTraces!: {
    worker: CdnTrace;
    browser: CdnTrace;
  };

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
        errors: [
          {
            type: 'skip',
            description: `Test skipped because it is in the skipTests list`,
          }
        ],
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
      const { worker, browser: container } = await this.getCdnTraces(browser, sessionId);
      const browserVersion = await browser.version();

      const context = await browser.createBrowserContext();
      const page = await context.newPage();
      setTestState({
        context,
        page,
        server: new TestServer(url.origin),
        httpsServer: new TestServer(url.origin),
      });

      const result = await testRunner.runTest(file, testId);

      // TODO handle skipped tests properly, probably requires a change in TestRunner
      if (result.status === 'failed') {
        const [error] = result.errors as Error[];
        if (error.message.includes('is not supported in this environment')) {
          result.status = "skipped";
          result.expectedStatus = "skipped";
          result.errors = [];
          result.annotations.push({
            type: 'skip',
            description: error.message.replace(/^Error: /, ''),
          });
        }
      }

      result.annotations.push({
        type: 'browser version',
        description: browserVersion,
      }, {
        type: 'session id',
        description: sessionId,
      }, {
        type: 'worker colo',
        description: worker.colo,
      }, {
        type: 'browser colo',
        description: container.colo,
      });
      
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

  private async getCdnTraces(browser: Browser, sessionId: string) {
    if (!this.cdnTraces) {
      const worker = parseTrace(await fetch('https://1.1.1.1/cdn-cgi/trace').then(resp => {
        return resp.text();
      }));
      const context = await browser.createBrowserContext();
      const page = await context.newPage();
      const browserCdnTrace = parseTrace(await page.goto('https://1.1.1.1/cdn-cgi/trace').then(resp => {
        return resp!.text();
      }));
      await page.close();
      await context.close();
  
      // eslint-disable-next-line no-console
      console.log(`ℹ️ Session ID: ${sessionId}, Worker: ${worker.colo}, Browser: ${browserCdnTrace.colo}`);
  
      this.cdnTraces = { worker, browser: browserCdnTrace };
    }

    return this.cdnTraces;
  }
}
