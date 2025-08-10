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
  Browser,
  WorkersLaunchOptions,
} from '@cloudflare/puppeteer';
import {expect} from 'expect';

import { getTestState } from '../server/mocha-utils.js';

function getBinding() {
  const binding = getTestState()?.binding;
  if (!binding) {
    throw new Error('Binding is not set in test state');
  }
  return binding;
}

async function launchAndGetSession(
  options?: WorkersLaunchOptions,
): Promise<[Browser, string]> {
  const browser = await launch(getBinding(), options);
  const sessionId = browser.sessionId();
  expect(sessionId).toBeDefined();
  return [browser, sessionId];
}

test(`should list sessions @smoke`, async () => {
  const before = await sessions(getBinding());
  const [browser, sessionId] = await launchAndGetSession();
  const after = await sessions(getBinding());

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
  const {sessionId} = await acquire(getBinding());
  const before = await sessions(getBinding());

  const connectedBrowser = await connect(getBinding(), sessionId);
  const after = await sessions(getBinding());

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

  const afterClose = await sessions(getBinding());
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
  const [browser, sessionId] = await launchAndGetSession();
  await browser.close();
  const afterClose = await sessions(getBinding());
  expect(
    afterClose.map(a => {
      return a.sessionId;
    }),
  ).not.toContain(sessionId);
});

test(`should close session after keep_alive`, async () => {
  const [browser, sessionId] = await launchAndGetSession({
    keep_alive: 15000,
  });
  await new Promise(resolve => {
    return setTimeout(resolve, 11000);
  });
  const beforeKeepAlive = await sessions(getBinding());
  expect(
    beforeKeepAlive.map(a => {
      return a.sessionId;
    }),
  ).toContain(sessionId);
  expect(browser.isConnected()).toBe(true);
  await new Promise(resolve => {
    return setTimeout(resolve, 5000);
  });
  const afterKeepAlive = await sessions(getBinding());
  expect(
    afterKeepAlive.map(a => {
      return a.sessionId;
    }),
  ).toContain(sessionId);
  expect(browser.isConnected()).toBe(true);
});

test(`should add new session to history when launching browser`, async () => {
  const before = await history(getBinding());
  const [launchedBrowser, sessionId] = await launchAndGetSession();
  const after = await history(getBinding());

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
  const [launchedBrowser, sessionId] = await launchAndGetSession();

  const response = await limits(getBinding());
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
