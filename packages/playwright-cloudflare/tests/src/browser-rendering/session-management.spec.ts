import { launch, connect, sessions, history, acquire, limits, endpointURLString, BrowserWorker, ActiveSession, Browser } from '@cloudflare/playwright';
import playwright from '@cloudflare/playwright';

import { test, expect } from '../server/workerFixtures';

async function fetchSingleSession(endpoint: BrowserWorker, sessionId: string) {
  const response = await endpoint.fetch(`http://fake.host/v1/devtools/session/${sessionId}`);
  expect(response.ok).toBeTruthy();
  const session = await response.json() as ActiveSession;
  expect(session.sessionId).toBe(sessionId);
  return session;
}

function sessionIds(activeSessions: ActiveSession[]) {
  return activeSessions.map(session => session.sessionId).sort();
}

async function waitForSessionToClose(endpoint: BrowserWorker, sessionId: string) {
  const deadline = Date.now() + 10000;
  while (Date.now() < deadline) {
    if (!(await sessions(endpoint)).some(session => session.sessionId === sessionId))
      return;
    await new Promise(resolve => setTimeout(resolve, 250));
  }
}

async function waitForBrowserToDisconnect(browser: Browser) {
  const deadline = Date.now() + 10000;
  while (browser.isConnected() && Date.now() < deadline)
    await new Promise(resolve => setTimeout(resolve, 250));
}

test(`should list sessions @smoke`, async ({ binding }) => {
  const before = await sessions(binding);
  const browser = await launch(binding);

  expect(before.map(a => a.sessionId)).not.toContain(browser.sessionId());
  // fails if session doesn't exist
  await fetchSingleSession(binding, browser.sessionId());

  await browser.close();
});

test(`should launch a lab browser`, async ({ binding }) => {
  const browser = await launch(binding, { lab: true });
  expect(browser.sessionId()).toBeTruthy();
  await browser.close();
});

test(`should pass lab and outbound workers to the RPC acquire method`, async () => {
  let received: unknown;
  const outboundWorker = { fetch: async () => new Response('ok') } as BrowserWorker;
  const rpcBinding = {
    fetch: async () => new Response('ok'),
    connectSession: async () => { throw new Error('not called'); },
    acquire: async (options: unknown) => {
      received = options;
      return { sessionId: 'session' };
    },
  } as BrowserWorker;

  await acquire(rpcBinding, { lab: true, outboundByHost: { 'app.example.com': outboundWorker } });
  expect(received).toEqual({ lab: true, outboundByHost: { 'app.example.com': outboundWorker } });
});

test(`should translate keep_alive for RPC acquire`, async () => {
  let received: unknown;
  const rpcBinding = {
    fetch: async () => new Response('ok'),
    connectSession: async () => { throw new Error('not called'); },
    acquire: async (options: unknown) => {
      received = options;
      return { sessionId: 'session' };
    },
  } as BrowserWorker;

  await acquire(rpcBinding, { lab: true, keep_alive: 30000 });
  expect(received).toEqual({ lab: true, keepAlive: 30000 });
});

test(`should pass translated options to RPC launch`, async () => {
  let received: unknown;
  const rpcBinding = {
    fetch: async () => new Response('ok'),
    launch: async (options: unknown) => {
      received = options;
      return {
        sessionId: 'session',
        webSocket: { fetch: async () => new Response('not a websocket') } as BrowserWorker,
      };
    },
  } as BrowserWorker;

  await expect(launch(rpcBinding, { lab: true, keep_alive: 30000 })).rejects.toThrow();
  expect(received).toEqual({ lab: true, keepAlive: 30000 });
});

test(`should preserve lab for a fetch-only acquire binding`, async () => {
  let request: Request | undefined;
  const legacyBinding = {
    fetch: async (input: RequestInfo | URL, init?: RequestInit) => {
      request = new Request(input, init);
      return Response.json({ sessionId: 'session' });
    },
  } as BrowserWorker;

  await acquire(legacyBinding, { lab: true });
  expect(new URL(request!.url).searchParams.get('lab')).toBe('true');
});

test(`should fall back to fetch when RPC session capabilities are incomplete`, async () => {
  let request: Request | undefined;
  let acquireCalled = false;
  const partialBinding = {
    fetch: async (input: RequestInfo | URL, init?: RequestInit) => {
      request = new Request(input, init);
      return Response.json({ sessionId: 'session' });
    },
    acquire: async () => {
      acquireCalled = true;
      return { sessionId: 'rpc-session' };
    },
  } as BrowserWorker;

  await acquire(partialBinding, { lab: true });
  expect(acquireCalled).toBe(false);
  expect(new URL(request!.url).searchParams.get('lab')).toBe('true');
});

test(`should call RPC acquire as a method on the binding`, async () => {
  // RPC stubs turn any property access, including `bind`, `call` and `apply`,
  // into a remote call that Browser Run does not implement.
  const rpcOnly = (name: string) => () => { throw new Error(`${name} must not be used on an RPC stub`); };
  let rpcCalls = 0;
  const rpcAcquire = Object.assign(
      async () => {
        rpcCalls++;
        return { sessionId: 'rpc-session' };
      },
      { bind: rpcOnly('bind'), call: rpcOnly('call'), apply: rpcOnly('apply') },
  );
  const rpcBinding = {
    fetch: async () => Response.json({ sessionId: 'fetch-session' }),
    connectSession: async () => { throw new Error('not called'); },
    acquire: rpcAcquire,
  } as unknown as BrowserWorker;

  expect(await acquire(rpcBinding)).toEqual({ sessionId: 'fetch-session' });
  expect(await acquire(rpcBinding, { lab: true })).toEqual({ sessionId: 'rpc-session' });
  expect(rpcCalls).toBe(1);
});

test(`should keep session open when closing browser created with connect`, async ({ binding }) => {
  const { sessionId } = await acquire(binding, { keep_alive: 10000 });
  const before = await sessions(binding);

  const connectedBrowser = await connect(binding, sessionId);
  const after = await sessions(binding);

  // no new session created
  expect(sessionIds(after)).toEqual(sessionIds(before));
  await connectedBrowser.close();

  const afterClose = await sessions(binding);
  expect(sessionIds(afterClose)).toEqual(sessionIds(after));

  await waitForSessionToClose(binding, sessionId);
  expect(sessionIds(await sessions(binding))).not.toContain(sessionId);
});

test(`should close session when launched browser is closed`, async ({ binding }) => {
  const browser = await launch(binding);
  const sessionId = browser.sessionId();
  await browser.close();
  await waitForSessionToClose(binding, sessionId);
  const afterClose = await sessions(binding);
  expect(afterClose.map(a => a.sessionId)).not.toContain(sessionId);
});

test(`should close session after keep_alive`, async ({ binding }) => {
  const browser = await launch(binding, { keep_alive: 15000 });
  const sessionId = browser.sessionId();

  try {
    await new Promise(resolve => setTimeout(resolve, 11000));
    expect(sessionIds(await sessions(binding))).toContain(sessionId);
    expect(browser.isConnected()).toBe(true);

    await waitForSessionToClose(binding, sessionId);
    await waitForBrowserToDisconnect(browser);

    expect(sessionIds(await sessions(binding))).not.toContain(sessionId);
    expect(browser.isConnected()).toBe(false);
  } finally {
    if (browser.isConnected())
      await browser.close().catch(() => {});
  }
});

test(`should add new session to history when launching browser`, async ({ binding }) => {
  const before = await history(binding);
  const launchedBrowser = await launch(binding);
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

test(`should connect to the session encoded in an endpoint URL`, async ({ binding, playwright }) => {
  const { sessionId } = await acquire(binding, { keep_alive: 10000 });
  const before = await sessions(binding);
  const url = endpointURLString(binding, { sessionId });
  const browser = await playwright.chromium.connectOverCDP(url);
  const after = await sessions(binding);

  expect(browser.sessionId()).toBe(sessionId);
  expect(sessionIds(after)).toEqual(sessionIds(before));
  await browser.close();
  await waitForSessionToClose(binding, sessionId);
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
