import { createInProcessPlaywright } from 'playwright-core/lib/inProcessFactory';
import { kBrowserCloseMessageId } from 'playwright-core/lib/server/chromium/crConnection';
import { env } from 'cloudflare:workers';
import { setTimeOrigin, timeOrigin } from 'playwright-core/lib/utils/isomorphic/time';

import { transportZone, WebSocketTransport } from './cloudflare/webSocketTransport';
import { wrapClientApis } from './cloudflare/wrapClientApis';
import { unsupportedOperations } from './cloudflare/unsupportedOperations';
import { encodeGuardrailsHeader, GUARDRAILS_HEADER } from './cloudflare/guardrails';
import * as packageJson from '../package.json';

import type { ProtocolRequest } from 'playwright-core/lib/server/transport';
import type { CRBrowser } from 'playwright-core/lib/server/chromium/crBrowser';
import type { AcquireResponse, ActiveSession, Browser, BrowserBindingKey, BrowserEndpoint, BrowserWorker, ClosedSession, ConnectOverCDPOptions, HistoryResponse, LimitsResponse, SessionGuardrails, SessionsResponse, WorkersLaunchOptions } from '..';
import type { ChannelOwner } from 'playwright-core/lib/client/channelOwner';

function resetMonotonicTime() {
  // performance.timeOrigin is always 0 in Cloudflare Workers. Besides, Date.now() is 0 in global scope,
  // so we need to set it to the current time inside a event handler, where Date.now() is not 0.
  // https://stackoverflow.com/a/58491358
  if (timeOrigin() === 0 && Date.now() !== 0)
    setTimeOrigin(Date.now());
}

const playwright = createInProcessPlaywright();
unsupportedOperations(playwright);
wrapClientApis();

const HTTP_FAKE_HOST = 'http://fake.host';
const WS_FAKE_HOST = 'ws://fake.host';

const originalConnectOverCDP = playwright.chromium.connectOverCDP;
// HACK this is a major hack, but we need it to make playwright-mcp and stagehand work without modifying their code extensively.
// Both playwright-mcp and stagehand use playwright.chromium.connectOverCDP if a CDP endpoint is passed,
// so we need to override it to use our own connectOverCDP implementation.
(playwright.chromium as any).connectOverCDP = (endpointURLOrOptions: (ConnectOverCDPOptions & { wsEndpoint?: string }) | string) => {
  const wsEndpoint = typeof endpointURLOrOptions === 'string' ? endpointURLOrOptions : endpointURLOrOptions.wsEndpoint ?? endpointURLOrOptions.endpointURL;
  if (!wsEndpoint)
    throw new Error('No wsEndpoint provided');
  const wsUrl = new URL(wsEndpoint);
  // by default, playwright.chromium.connectOverCDP enforces persistent to true (the default behavior upstream)
  if (!wsUrl.searchParams.has('persistent'))
    wsUrl.searchParams.set('persistent', 'true');
  return wsUrl.searchParams.has('browser_session')
    ? connect(wsUrl.toString())
    : launch(wsUrl.toString());
};

async function connectDevtools(endpoint: BrowserEndpoint, options: { sessionId?: string, persistent?: boolean, browser?: string, guardrails?: SessionGuardrails }): Promise<WebSocket> {
  resetMonotonicTime();
  const url = new URL(`${HTTP_FAKE_HOST}/v1/devtools/browser${options.sessionId ? `/${options.sessionId}` : ''}`);
  if (options.persistent)
    url.searchParams.set('persistent', 'true');
  if (options.browser)
    url.searchParams.set('browser', options.browser);
  // Only on the upgrade that acquires. Connecting to an existing session carries the policy
  // it was acquired with, and core rejects a session-scoped one there because guardrails are
  // latched at acquire time and cannot be changed afterwards.
  const guardrails = options.sessionId ? undefined : options.guardrails;
  const response = await getBrowserBinding(endpoint).fetch(url, {
    headers: {
      'Upgrade': 'websocket',
      'cf-brapi-client': `@cloudflare/playwright@${packageJson.version}`,
      ...(guardrails ? { [GUARDRAILS_HEADER]: encodeGuardrailsHeader(guardrails) } : {}),
    },
  });
  // A refused upgrade has no websocket to accept, so surface what core said instead of
  // failing on a null dereference further down.
  if (!response.webSocket)
    throw new Error(`Unable to connect to browser: code: ${response.status}: message: ${await response.text()}`);

  const webSocket = response.webSocket;
  webSocket.accept();
  return webSocket;
}

function extractOptions(endpoint: BrowserEndpoint): { sessionId?: string, keep_alive?: number, persistent?: boolean, browser?: 'kitesurf' } {
  if (typeof endpoint === 'string' || endpoint instanceof URL) {
    const url = endpoint instanceof URL ? endpoint : new URL(endpoint);
    // Support both old format (?browser_session=) and new format (/v1/devtools/browser/:sessionId)
    const pathMatch = url.pathname.match(/^\/v1\/devtools\/browser\/([^/]+)$/);
    const sessionId = pathMatch?.[1] ?? url.searchParams.get('browser_session') ?? undefined;
    const keepAlive = url.searchParams.has('keep_alive') ? parseInt(url.searchParams.get('keep_alive')!, 10) : undefined;
    const persistent = url.searchParams.has('persistent');
    const browser = (url.searchParams.get('browser') as 'kitesurf' | null) ?? undefined;
    return { sessionId, keep_alive: keepAlive, persistent, browser };
  }
  return {};
}

export function endpointURLString(binding: BrowserWorker | BrowserBindingKey, options?: { sessionId?: string, persistent?: boolean, keepAlive?: number, browser?: 'kitesurf' }): string {
  const bindingKey = typeof binding === 'string' ? binding : Object.keys(env).find(key => (env as any)[key] === binding);
  if (!bindingKey || !(bindingKey in env))
    throw new Error(`No binding found for ${binding}`);

  const sessionPath = options?.sessionId ? `/${options.sessionId}` : '';
  const url = new URL(`${HTTP_FAKE_HOST}/v1/devtools/browser${sessionPath}`);
  url.searchParams.set('browser_binding', bindingKey);
  if (options?.browser)
    url.searchParams.set('browser', options.browser);
  if (options?.persistent)
    url.searchParams.set('persistent', 'true');
  if (options?.keepAlive)
    url.searchParams.set('keep_alive', options.keepAlive.toString());
  return url.toString();
}

async function createBrowser(transport: WebSocketTransport, options?: { persistent?: boolean }): Promise<Browser> {
  return await transportZone.run(transport, async () => {
    const url = new URL(WS_FAKE_HOST);
    if (options?.persistent)
      url.searchParams.set('persistent', 'true');
    const browser = await originalConnectOverCDP.call(playwright.chromium, url.toString(), {}) as Browser;
    // sessionId is undefined for kitesurf browsers
    // The public types express that through the SessionlessBrowser overload of launch().
    browser.sessionId = () => transport.sessionId as string;
    return browser;
  });
}

function getBrowserBinding(endpoint: BrowserEndpoint): BrowserWorker {
  if (typeof endpoint === 'string' || endpoint instanceof URL) {
    const url = endpoint instanceof URL ? endpoint : new URL(endpoint);
    const binding = url.searchParams.get('browser_binding') as BrowserBindingKey;
    if (!binding || !(binding in env))
      throw new Error(`No binding found for ${binding}`);
    return env[binding];
  }
  return endpoint;
}

export async function connect(endpoint: string | URL): Promise<Browser>;
export async function connect(endpoint: BrowserWorker, sessionIdOrOptions: string | { sessionId: string, persistent?: boolean }): Promise<Browser>;
export async function connect(endpoint: BrowserEndpoint, sessionIdOrOptions?: string | { sessionId: string, persistent?: boolean }): Promise<Browser> {
  const extraOptions = typeof sessionIdOrOptions === 'string' ? { sessionId: sessionIdOrOptions } : sessionIdOrOptions ?? {};
  const options = { ...extractOptions(endpoint), ...extraOptions };
  if (!options.sessionId)
    throw new Error(`Session ID is required for connect()`);

  const webSocket = await connectDevtools(getBrowserBinding(endpoint), options as { sessionId: string });
  const transport = new WebSocketTransport(webSocket, options.sessionId);
  // keeps the endpoint and options for client -> server async communication
  return await createBrowser(transport, options);
}

export async function launch(endpoint: BrowserEndpoint, launchOptions?: WorkersLaunchOptions & { persistent?: boolean }): Promise<Browser> {
  const options = { ...extractOptions(endpoint), ...launchOptions };
  // kitesurf browsers acquire and connect in one go, skip acquire
  // and connect straight to the devtools endpoint without a session id
  const sessionId = options.browser === 'kitesurf' ? undefined : (await acquire(endpoint, launchOptions)).sessionId;
  const webSocket = await connectDevtools(getBrowserBinding(endpoint), { ...options, sessionId });
  const transport = new WebSocketTransport(webSocket, sessionId);
  // keeps the endpoint and options for client -> server async communication
  const browser = await createBrowser(transport, options) as Browser & ChannelOwner;

  const browserImpl = browser._connection.toImpl!(browser) as CRBrowser;
  // ensure we actually close the browser
  const doClose = async () => {
    const message: ProtocolRequest = { method: 'Browser.close', id: kBrowserCloseMessageId, params: {} };
    transport.send(message);
  };
  browserImpl.options.browserProcess = { close: doClose, kill: doClose };
  return browser;
}

export async function acquire(endpoint: BrowserEndpoint, options?: WorkersLaunchOptions): Promise<AcquireResponse> {
  options = { ...extractOptions(endpoint), ...options };

  // add options to acquire endpoint as query parameters
  const searchParams = new URLSearchParams();
  if (options?.keep_alive)
    searchParams.set("keep_alive", options.keep_alive.toString());
  if (options?.recording)
    searchParams.set("recording", options.recording.toString());
  if (options?.lab)
    searchParams.set("lab", options.lab.toString());

  // POST /v1/devtools/browser rather than GET /v1/acquire: it takes the same query
  // parameters and is the only acquire endpoint that accepts a guardrails policy.
  const acquireUrl = `${HTTP_FAKE_HOST}/v1/devtools/browser?${searchParams.toString()}`;
  const res = await getBrowserBinding(endpoint).fetch(acquireUrl, {
    method: 'POST',
    // Guardrails travel in the body here, unlike the websocket upgrades that have to
    // use a header.
    ...(options?.guardrails
      ? {
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ guardrails: options.guardrails }),
      }
      : {}),
  });
  const status = res.status;
  const text = await res.text();
  if (status !== 200) {
    throw new Error(
      `Unable to create new browser: code: ${status}: message: ${text}`
    );
  }
  // Got a 200, so response text is actually an AcquireResponse
  const response: AcquireResponse = JSON.parse(text);
  return response;
}

export async function sessions(endpoint: BrowserEndpoint): Promise<ActiveSession[]> {
  const res = await getBrowserBinding(endpoint).fetch(`${HTTP_FAKE_HOST}/v1/sessions`);
  const status = res.status;
  const text = await res.text();
  if (status !== 200) {
    throw new Error(
        `Unable to fetch new sessions: code: ${status}: message: ${text}`
    );
  }
  const data: SessionsResponse = JSON.parse(text);
  return data.sessions;
}

export async function history(endpoint: BrowserEndpoint): Promise<ClosedSession[]> {
  const res = await getBrowserBinding(endpoint).fetch(`${HTTP_FAKE_HOST}/v1/history`);
  const status = res.status;
  const text = await res.text();
  if (status !== 200) {
    throw new Error(
        `Unable to fetch account history: code: ${status}: message: ${text}`
    );
  }
  const data: HistoryResponse = JSON.parse(text);
  return data.history;
}

export async function limits(endpoint: BrowserEndpoint): Promise<LimitsResponse> {
  const res = await getBrowserBinding(endpoint).fetch(`${HTTP_FAKE_HOST}/v1/limits`);
  const status = res.status;
  const text = await res.text();
  if (status !== 200) {
    throw new Error(
        `Unable to fetch account limits: code: ${status}: message: ${text}`
    );
  }
  const data: LimitsResponse = JSON.parse(text);
  return data;
}

export const chromium = playwright.chromium;
export const selectors = playwright.selectors;
export const devices = playwright.devices;
export const errors = playwright.errors;
export const request = playwright.request;
export const _instrumentation = playwright._instrumentation;

export default {
  chromium,
  selectors,
  devices,
  errors,
  request,
  _instrumentation,
  endpointURLString,
  launch,
  connect,
  sessions,
  history,
  acquire,
  limits,
};
