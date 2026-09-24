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
  ActiveSession,
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

async function fetchSingleSession(endpoint: BrowserWorker, sessionId: string) {
  const response = await endpoint.fetch(`http://fake.host/v1/devtools/session/${sessionId}`);
  expect(response.ok).toBe(true);
  const session = await response.json() as ActiveSession;
  expect(session.sessionId).toBe(sessionId);
  return session;
}

function sessionIds(activeSessions: ActiveSession[]): string[] {
  return activeSessions.map(session => {
    return session.sessionId;
  }).sort();
}

async function waitForSessionToClose(
  endpoint: BrowserWorker,
  sessionId: string,
  timeout = 10000,
): Promise<void> {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    if (!(await sessions(endpoint)).some(session => {
      return session.sessionId === sessionId;
    })) {
      return;
    }
    await new Promise(resolve => {
      return setTimeout(resolve, 250);
    });
  }
}

async function waitForBrowserToDisconnect(
  browser: Browser,
  timeout = 10000,
): Promise<void> {
  const deadline = Date.now() + timeout;
  while (browser.isConnected() && Date.now() < deadline) {
    await new Promise(resolve => {
      return setTimeout(resolve, 250);
    });
  }
}

test(`should list sessions @smoke`, async () => {
  const before = await sessions(env.BROWSER);
  const [browser, sessionId] = await launchAndGetSession(env.BROWSER);

  expect(
    before.map(a => {
      return a.sessionId;
    }),
  ).not.toContain(sessionId);
  // fails if session doesn't exist
  await fetchSingleSession(env.BROWSER, browser.sessionId());

  await browser.close();
});

test(`should launch a lab browser`, async () => {
  const browser = await launch(env.BROWSER, {lab: true});
  expect(browser.sessionId()).toBeTruthy();
  await browser.close();
});

test(`should reject lab combined with browser=kitesurf`, async () => {
  const binding = {
    fetch: async () => {
      return new Response('ok');
    },
  } as BrowserWorker;
  await expect(
    launch(binding, {browser: 'kitesurf', lab: true}),
  ).rejects.toThrow(/browser="kitesurf".*lab/);
});

test(`should reject outbound workers combined with browser=kitesurf`, async () => {
  const binding = {
    fetch: async () => {
      return new Response('ok');
    },
  } as BrowserWorker;
  const outboundWorker = {
    fetch: async () => {
      return new Response('ok');
    },
  } as BrowserWorker;
  await expect(
    launch(binding, {
      browser: 'kitesurf',
      outboundByHost: {'app.example.com': outboundWorker},
    }),
  ).rejects.toThrow(/browser="kitesurf".*outboundByHost/);
});

test(`should pass lab and outbound workers to the RPC acquire method`, async () => {
  let received: unknown;
  const outboundWorker = {
    fetch: async () => {
      return new Response('ok');
    },
  } as BrowserWorker;
  const rpcBinding = {
    fetch: async () => {
      return new Response('ok');
    },
    connectSession: async () => {
      throw new Error('not called');
    },
    acquire: async (options: unknown) => {
      received = options;
      return {sessionId: 'session'};
    },
  } as BrowserWorker;

  await acquire(rpcBinding, {
    lab: true,
    outboundByHost: {'app.example.com': outboundWorker},
  });
  expect(received).toEqual({
    lab: true,
    outboundByHost: {'app.example.com': outboundWorker},
  });
});

test(`should translate keep_alive for RPC acquire`, async () => {
  let received: unknown;
  const rpcBinding = {
    fetch: async () => {
      return new Response('ok');
    },
    connectSession: async () => {
      throw new Error('not called');
    },
    acquire: async (options: unknown) => {
      received = options;
      return {sessionId: 'session'};
    },
  } as BrowserWorker;

  await acquire(rpcBinding, {lab: true, keep_alive: 30000});
  expect(received).toEqual({lab: true, keepAlive: 30000});
});

test(`should pass translated options to RPC launch and reuse its pinned Fetcher`, async () => {
  let received: unknown;
  let connectSessionCalls = 0;
  const pinnedWebSocket = {
    fetch: async () => {
      return new Response('not a websocket');
    },
    connectSession: async () => {
      connectSessionCalls++;
      throw new Error('pinned Fetcher was probed');
    },
  } as BrowserWorker;
  const rpcBinding = {
    fetch: async () => {
      return new Response('ok');
    },
    launch: async (options: unknown) => {
      received = options;
      return {sessionId: 'session', webSocket: pinnedWebSocket};
    },
  } as BrowserWorker;

  await expect(
    launch(rpcBinding, {lab: true, keep_alive: 30000}),
  ).rejects.toThrow();
  expect(received).toEqual({lab: true, keepAlive: 30000});
  expect(connectSessionCalls).toBe(0);
});

test(`should preserve lab for a legacy acquire binding`, async () => {
  let request: Request | undefined;
  const legacyBinding = {
    fetch: async (input: RequestInfo | URL, init?: RequestInit) => {
      request = new Request(input, init);
      return Response.json({sessionId: 'session'});
    },
  } as BrowserWorker;

  await acquire(legacyBinding, {lab: true});
  expect(new URL(request!.url).searchParams.get('lab')).toBe('true');
});

test(`should fall back to fetch when RPC session capabilities are incomplete`, async () => {
  let request: Request | undefined;
  let acquireCalled = false;
  const partialBinding = {
    fetch: async (input: RequestInfo | URL, init?: RequestInit) => {
      request = new Request(input, init);
      return Response.json({sessionId: 'session'});
    },
    acquire: async () => {
      acquireCalled = true;
      return {sessionId: 'rpc-session'};
    },
  } as BrowserWorker;

  await acquire(partialBinding, {lab: true});
  expect(acquireCalled).toBe(false);
  expect(new URL(request!.url).searchParams.get('lab')).toBe('true');
});

test(`should call RPC acquire as a method on the binding`, async () => {
  // RPC stubs turn any property access, including `bind`, `call` and `apply`,
  // into a remote call that Browser Run does not implement.
  const rpcOnly = (name: string) => {
    return () => {
      throw new Error(`${name} must not be used on an RPC stub`);
    };
  };
  let rpcCalls = 0;
  const rpcAcquire = Object.assign(
    async () => {
      rpcCalls++;
      return {sessionId: 'rpc-session'};
    },
    {bind: rpcOnly('bind'), call: rpcOnly('call'), apply: rpcOnly('apply')},
  );
  const rpcBinding = {
    fetch: async () => {
      return Response.json({sessionId: 'fetch-session'});
    },
    connectSession: async () => {
      throw new Error('not called');
    },
    acquire: rpcAcquire,
  } as unknown as BrowserWorker;

  expect(await acquire(rpcBinding)).toEqual({sessionId: 'fetch-session'});
  expect(await acquire(rpcBinding, {lab: true})).toEqual({
    sessionId: 'rpc-session',
  });
  expect(rpcCalls).toBe(1);
});

test(`should keep session open when closing browser created with connect`, async () => {
  const {sessionId} = await acquire(env.BROWSER, {keep_alive: 10000});
  const before = await sessions(env.BROWSER);

  const connectedBrowser = await connect(env.BROWSER, sessionId);
  const after = await sessions(env.BROWSER);

  // no new session created
  expect(sessionIds(after)).toEqual(sessionIds(before));
  await connectedBrowser.close();

  const afterClose = await sessions(env.BROWSER);
  expect(sessionIds(afterClose)).toEqual(sessionIds(after));

  await waitForSessionToClose(env.BROWSER, sessionId);
  expect(sessionIds(await sessions(env.BROWSER))).not.toContain(sessionId);
});

test(`should close session when launched browser is closed`, async () => {
  const [browser, sessionId] = await launchAndGetSession(env.BROWSER);
  await browser.close();
  await waitForSessionToClose(env.BROWSER, sessionId);
  const afterClose = await sessions(env.BROWSER);
  expect(
    afterClose.map(a => {
      return a.sessionId;
    }),
  ).not.toContain(sessionId);
});

test(`should close session after keep_alive`, async () => {
  const keepAlive = 15000;
  const [browser, sessionId] = await launchAndGetSession(env.BROWSER, {
    keep_alive: keepAlive,
  });

  try {
    await new Promise(resolve => {
      return setTimeout(resolve, 11000);
    });
    expect(
      (await sessions(env.BROWSER)).map(session => {
        return session.sessionId;
      }),
    ).toContain(sessionId);
    expect(browser.isConnected()).toBe(true);

    await waitForSessionToClose(env.BROWSER, sessionId, 15000);
    await waitForBrowserToDisconnect(browser);

    expect(
      (await sessions(env.BROWSER)).map(session => {
        return session.sessionId;
      }),
    ).not.toContain(sessionId);
    expect(browser.isConnected()).toBe(false);
  } finally {
    if (browser.isConnected()) {
      await browser.close().catch(() => {});
    }
  }
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
