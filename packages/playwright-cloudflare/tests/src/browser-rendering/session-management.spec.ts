import { launch, connect, sessions, history, acquire, limits, endpointURLString, BrowserEndpoint, BrowserWorker, ActiveSession } from '@cloudflare/playwright';
import playwright from '@cloudflare/playwright';

import { test, expect } from '../server/workerFixtures';

async function fetchSingleSession(endpoint: BrowserWorker, sessionId: string) {
  const response = await endpoint.fetch(`http://fake.host/v1/devtools/session/${sessionId}`);
  expect(response.ok).toBeTruthy();
  const session = await response.json() as ActiveSession;
  expect(session.sessionId).toBe(sessionId);
  return session;
}

test(`should list sessions @smoke`, async ({ binding }) => {
  const before = await sessions(binding);
  const browser = await launch(binding);
  
  expect(before.map(a => a.sessionId)).not.toContain(browser.sessionId());
  // fails if session doesn't exist
  await fetchSingleSession(binding, browser.sessionId());

  browser.close();
});

test(`should keep session open when closing browser created with connect`, async ({ binding }) => {
  const { sessionId } = await acquire(binding);
  const before = await sessions(binding);

  const connectedBrowser = await connect(binding, sessionId);
  const after = await sessions(binding);

  // no new session created
  expect(after.map(a => a.sessionId)).toEqual(before.map(b => b.sessionId));
  await connectedBrowser.close();

  const afterClose = await sessions(binding);
  expect(afterClose.map(b => b.sessionId)).toEqual(after.map(a => a.sessionId));
});

test(`should close session when launched browser is closed`, async ({ binding }) => {
  const browser = await launch(binding);
  await browser.close();
  const afterClose = await sessions(binding);
  expect(afterClose.map(a => a.sessionId)).not.toContain(browser.sessionId());
});

test(`should close session after keep_alive`, async ({ binding }) => {
  const browser = await launch(binding, { keep_alive: 15000 });
  await new Promise(resolve => setTimeout(resolve, 11000));
  const beforeKeepAlive = await sessions(binding);
  expect(beforeKeepAlive.map(a => a.sessionId)).toContain(browser.sessionId());
  expect(browser.isConnected()).toBe(true);
  await new Promise(resolve => setTimeout(resolve, 5000));
  const afterKeepAlive = await sessions(binding);
  expect(afterKeepAlive.map(a => a.sessionId)).toContain(browser.sessionId());
  expect(browser.isConnected()).toBe(true);
});

test(`should add new session to history when launching browser`, async ({ binding }) => {
  const before = await history(binding);
  const launchedBrowser = await launch (binding);
  const after = await history(binding);

  expect(before.map(a => a.sessionId)).not.toContain(launchedBrowser.sessionId());
  expect(after.map(a => a.sessionId)).toContain(launchedBrowser.sessionId());

  await launchedBrowser.close();
});

test(`should show sessionId in active sessions under limits endpoint`, async ({ binding }) => {
  const launchedBrowser = await launch(binding);

  const response = await limits(binding);
  expect(response.activeSessions.map(s => s.id)).toContain(launchedBrowser.sessionId());

  await launchedBrowser.close();
});

test(`should have functions in default exported object`, () => {
  expect(playwright.launch).toBe(launch);
  expect(playwright.connect).toBe(connect);
  expect(playwright.sessions).toBe(sessions);
  expect(playwright.history).toBe(history);
  expect(playwright.acquire).toBe(acquire);
  expect(playwright.limits).toBe(limits);
});

test(`should create endpoint url`, async ({ binding }) => {
  const url1 = endpointURLString(binding);
  expect(url1).toContain('http://fake.host/v1/devtools/browser?browser_binding=BROWSER');

  const url2 = endpointURLString('BROWSER');
  expect(url2).toContain('http://fake.host/v1/devtools/browser?browser_binding=BROWSER');

  // @ts-expect-error
  expect(() => endpointURLString('UNEXISTENT_BROWSER')).toThrow();

  const url3 = endpointURLString(binding, { sessionId: 'test-session-id' });
  expect(url3).toContain('http://fake.host/v1/devtools/browser/test-session-id?browser_binding=BROWSER');

  const url4 = endpointURLString(binding, { browser: 'kitesurf' });
  expect(url4).toBe('http://fake.host/v1/devtools/browser?browser_binding=BROWSER&browser=kitesurf');
});

test(`should create browser with persistent context on playwright.chromium.connectOverCDP`, async ({ binding, playwright }) => {
  const url = endpointURLString(binding);
  const browser = await playwright.chromium.connectOverCDP(url);
  expect(browser.contexts()).toHaveLength(1);
  const [context] = browser.contexts();
  expect(context.pages()).toHaveLength(1);
  const [page] = context.pages();
  expect(page.viewportSize()).toEqual({ width: 1280, height: 720 });
  await browser.close();
});

test(`should launch browser with no persistent context by default`, async ({ binding }) => {
  const url = endpointURLString(binding);
  const browser = await launch(url);
  expect(browser.contexts()).toHaveLength(0);
  await browser.close();
});

test(`should launch browser with persistent context is persistent=true`, async ({ binding }) => {
  // @ts-expect-error
  const url = endpointURLString(binding, { persistent: true });
  const browser = await launch(url);
  expect(browser.contexts()).toHaveLength(1);
  await browser.close();
});
