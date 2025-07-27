import type {BrowserContext, Cookie, Page} from '@cloudflare/puppeteer';
import expect from 'expect';

import { Skipped } from './utils.js';

export class TestServer {
  PORT!: number;
  PREFIX: string;
  CROSS_PROCESS_PREFIX: string;
  EMPTY_PAGE: string;

  constructor(assetsUrl: string) {
    this.PREFIX = assetsUrl;
    this.CROSS_PROCESS_PREFIX = assetsUrl.replace(
      /\:\/\/([^.]+)\./,
      '://$1-cross-origin.',
    );
    this.EMPTY_PAGE = `${assetsUrl}/empty.html`;
  }

  get port(): never {
    throw new Skipped('TestServer.port is not supported in this environment');
  }

  enableHTTPCache(): never {
    throw new Skipped('TestServer.enableHTTPCache is not supported in this environment');
  }

  setAuth(): never {
    throw new Skipped('TestServer.setAuth is not supported in this environment');
  }

  enableGzip(): never {
    throw new Skipped('TestServer.enableGzip is not supported in this environment');
  }

  setCSP(): never {
    throw new Skipped('TestServer.setCSP is not supported in this environment');
  }

  async stop(): Promise<never> {
    throw new Skipped('TestServer.stop is not supported in this environment');
  }

  setRoute(): never {
    throw new Skipped('TestServer.setRoute is not supported in this environment');
  }

  setRedirect(): never {
    throw new Skipped('TestServer.setRedirect is not supported in this environment');
  }

  waitForRequest(): Promise<never> {
    throw new Skipped('TestServer.waitForRequest is not supported in this environment');
  }

  reset(): never {
    throw new Skipped('TestServer.reset is not supported in this environment');
  }

  serveFile(): never {
    throw new Skipped('TestServer.serveFile is not supported in this environment');
  }
}

interface TestState {
  context: BrowserContext;
  page: Page;
  server: TestServer;
  httpsServer: TestServer;
}

export function setTestState(testState: TestState | undefined): void {
  (globalThis as any)._testState = testState;
}

export function getTestState(): TestState {
  if (!(globalThis as any)._testState) {
    throw new Error('Test state is not set');
  }
  return (globalThis as any)._testState;
}

export function setupTestBrowserHooks(): void {
  // do nothing
}

export function launch(): never {
  throw new Skipped('Skipped because launch is not supported in this environment');
}

export const expectCookieEquals = async (
  cookies: Cookie[],
  expectedCookies: Array<Partial<Cookie>>
): Promise<void> => {
  expect(cookies).toHaveLength(expectedCookies.length);
  for (let i = 0; i < cookies.length; i++) {
    expect(cookies[i]).toMatchObject(expectedCookies[i]!);
  }
};

export const shortWaitForArrayToHaveAtLeastNElements = async (
  data: unknown[],
  minLength: number,
  attempts = 3,
  timeout = 50
): Promise<void> => {
  for (let i = 0; i < attempts; i++) {
    if (data.length >= minLength) {
      break;
    }
    await new Promise(resolve => {
      return setTimeout(resolve, timeout);
    });
  }
};
