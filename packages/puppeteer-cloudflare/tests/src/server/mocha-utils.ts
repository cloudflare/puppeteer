import type {Cookie, Page} from '@cloudflare/puppeteer';
import expect from 'expect';

export class TestServer {
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
}

interface TestState {
  page: Page;
  server: TestServer;
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
  throw new Error('Not implemented');
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
