import {
  launch,
  connect,
  sessions,
  history,
  acquire,
  limits,
} from '@cloudflare/puppeteer';
import puppeteer from '@cloudflare/puppeteer';
import type {
  BrowserWorker,
  Browser,
  WorkersLaunchOptions,
} from '@cloudflare/puppeteer';
import {env} from 'cloudflare:workers';
import {expect} from 'expect';

async function launchAndGetSession(
  endpoint: BrowserWorker,
  options?: WorkersLaunchOptions,
): Promise<[Browser, string]> {
  const browser = await launch(endpoint, options);
  const sessionId = browser.sessionId();
  expect(sessionId).toBeDefined();
  return [browser, sessionId];
}

test(`should list sessions @smoke`, async () => {
  const before = await sessions(env.BROWSER);
  const [browser, sessionId] = await launchAndGetSession(env.BROWSER);
  const after = await sessions(env.BROWSER);

  expect(
    before.map(a => {
      return a.sessionId;
    }),
  ).not.toContain(sessionId);
  expect(
    after.map(a => {
      return a.sessionId;
    }),
  ).toContain(sessionId);

  await browser.close();
});

test(`should keep session open when closing browser created with connect`, async () => {
  const {sessionId} = await acquire(env.BROWSER);
  const before = await sessions(env.BROWSER);

  const connectedBrowser = await connect(env.BROWSER, sessionId);
  const after = await sessions(env.BROWSER);

  // no new session created
  expect(
    after.map(a => {
      return a.sessionId;
    }),
  ).toEqual(
    before.map(b => {
      return b.sessionId;
    }),
  );
  await connectedBrowser.close();

  const afterClose = await sessions(env.BROWSER);
  expect(
    afterClose.map(b => {
      return b.sessionId;
    }),
  ).toEqual(
    after.map(a => {
      return a.sessionId;
    }),
  );
});

test(`should close session when launched browser is closed`, async () => {
  const [browser, sessionId] = await launchAndGetSession(env.BROWSER);
  await browser.close();
  const afterClose = await sessions(env.BROWSER);
  expect(
    afterClose.map(a => {
      return a.sessionId;
    }),
  ).not.toContain(sessionId);
});

test(`should close session after keep_alive`, async () => {
  const [browser, sessionId] = await launchAndGetSession(env.BROWSER, {
    keep_alive: 15000,
  });
  await new Promise(resolve => {
    return setTimeout(resolve, 11000);
  });
  const beforeKeepAlive = await sessions(env.BROWSER);
  expect(
    beforeKeepAlive.map(a => {
      return a.sessionId;
    }),
  ).toContain(sessionId);
  expect(browser.isConnected()).toBe(true);
  await new Promise(resolve => {
    return setTimeout(resolve, 5000);
  });
  const afterKeepAlive = await sessions(env.BROWSER);
  expect(
    afterKeepAlive.map(a => {
      return a.sessionId;
    }),
  ).toContain(sessionId);
  expect(browser.isConnected()).toBe(true);
});

test(`should add new session to history when launching browser`, async () => {
  const before = await history(env.BROWSER);
  const [launchedBrowser, sessionId] = await launchAndGetSession(env.BROWSER);
  const after = await history(env.BROWSER);

  expect(
    before.map(a => {
      return a.sessionId;
    }),
  ).not.toContain(sessionId);
  expect(
    after.map(a => {
      return a.sessionId;
    }),
  ).toContain(sessionId);

  await launchedBrowser.close();
});

test(`should show sessionId in active sessions under limits endpoint`, async () => {
  const [launchedBrowser, sessionId] = await launchAndGetSession(env.BROWSER);

  const response = await limits(env.BROWSER);
  expect(
    response.activeSessions.map(s => {
      return s.id;
    }),
  ).toContain(sessionId);

  await launchedBrowser.close();
});

test(`should have functions in default exported object`, () => {
  expect(puppeteer.launch).toBe(launch);
  expect(puppeteer.connect).toBe(connect);
  expect(puppeteer.sessions).toBe(sessions);
  expect(puppeteer.history).toBe(history);
  expect(puppeteer.acquire).toBe(acquire);
  expect(puppeteer.limits).toBe(limits);
});
