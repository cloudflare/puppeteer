import * as FS from 'fs';
import type { Browser } from './types/types';
import { chromium, request, selectors, devices } from './types/types';
import { env } from 'cloudflare:workers';

export * from './types/types';

// Re-export the Cloudflare.* CDP command types and pull in their augmentation
// of Protocol.CommandParameters / CommandReturnValues so that
// cdpSession.send('Cloudflare.*', ...) is typed.
export * from './cloudflare-cdp';

declare module './types/types' {
  interface Browser {
    /**
     * Get the Browser Rendering session ID associated with this browser
     *
     * @public
     */
    sessionId(): string;
  }
}

/**
 * Returned by `launch()` when `browser: 'kitesurf'` is passed, since in that case no
 * session is acquired and the connection is made straight to the devtools endpoint.
 *
 * @public
 */
export interface SessionlessBrowser extends Omit<Browser, 'sessionId'> {
  sessionId(): undefined;
}

// Browser Run types come from the Workers runtime types, which every Worker
// project loads, either from @cloudflare/workers-types or from `wrangler types`.
// Refer to their global names instead of copying them, so that they cannot
// drift from the binding. They require @cloudflare/workers-types 5.20260917.1 or
// later, or the types that `wrangler types` generates with Wrangler 4.134.0 or
// later.

/**
 * Guardrails that restrict the outbound traffic of a browser session.
 *
 * @remarks
 * Set when the session is acquired and latched for its lifetime: they cannot be
 * changed or removed by later connections. An empty `allowedDomains` denies all
 * outbound traffic, and an invalid policy fails closed rather than allowing
 * unrestricted access.
 *
 * @public
 */
export type SessionGuardrails = BrowserRunAcquireGuardrails;

/**
 * A Browser Run binding, or any other binding with a Browser Run compatible
 * `fetch`, such as a service binding.
 *
 * @remarks
 * Only `fetch` is required. The Browser Run RPC methods are used when the
 * binding has them.
 *
 * @public
 */
export interface BrowserWorker extends Partial<Pick<BrowserRun, 'launch' | 'acquire' | 'connectSession'>> {
  fetch: typeof fetch;
}

export type BrowserEndpoint = BrowserWorker | string | URL;

/**
 * @public
 */
export type AcquireResponse = BrowserRunAcquireResult;

/**
 * @public
 */
export type ActiveSession = BrowserRunSession;

/**
 * @public
 */
export type ClosedSession = BrowserRunSession;

/**
 * @public
 */
export interface SessionsResponse {
  sessions: ActiveSession[];
}

/**
 * @public
 */
export interface HistoryResponse {
  history: ClosedSession[];
}

/**
 * @public
 */
export type LimitsResponse = BrowserRunLimits;

/**
 * @public
 */
export interface WorkersLaunchOptions {
  keep_alive?: number; // milliseconds to keep browser alive even if it has no activity (from 10_000ms to 600_000ms, default is 60_000)
  recording?: boolean;
  lab?: boolean;
  browser?: 'kitesurf'; // when set to 'kitesurf', no session is acquired and the connection is made directly to /v1/devtools/browser
  outboundByHost?: BrowserRunAcquireOptions['outboundByHost'];
  // restricts the outbound traffic of the session being acquired, latched for
  // its lifetime
  guardrails?: SessionGuardrails;
}

/**
 * @public
 */
export interface WorkersConnectOptions {
  sessionId: string; // session ID to connect to
}

// Extracts the keys whose values match a specified type `ValueType`
type KeysByValueType<T, ValueType> = {
  [K in keyof T]: T[K] extends ValueType ? K : never;
}[keyof T];

export type BrowserBindingKey = KeysByValueType<typeof env, BrowserWorker>;

// `guardrails` and `outboundByHost` are excluded: they are sent through the RPC
// acquire call, so an endpoint URL cannot carry them and accepting them here
// would silently drop them.
export function endpointURLString(binding: BrowserWorker | BrowserBindingKey, options?: Omit<WorkersLaunchOptions, 'guardrails' | 'outboundByHost'> | WorkersConnectOptions): string;

export function connect(endpoint: string | URL): Promise<Browser>;
export function connect(endpoint: BrowserWorker, sessionIdOrOptions: string | WorkersConnectOptions): Promise<Browser>;

export function launch(endpoint: BrowserEndpoint, options: WorkersLaunchOptions & { browser: 'kitesurf' }): Promise<SessionlessBrowser>;
export function launch(endpoint: BrowserEndpoint, options?: WorkersLaunchOptions): Promise<Browser>;

export function acquire(endpoint: BrowserEndpoint, options?: WorkersLaunchOptions): Promise<AcquireResponse>;

/**
 * Returns active sessions
 *
 * @remarks
 * Sessions with a connnectionId already have a worker connection established
 *
 * @param endpoint - Cloudflare worker binding
 * @returns List of active sessions
 */
export function sessions(endpoint: BrowserEndpoint): Promise<ActiveSession[]>;

/**
 * Returns recent sessions (active and closed)
 *
 * @param endpoint - Cloudflare worker binding
 * @returns List of recent sessions (active and closed)
 */
export function history(endpoint: BrowserEndpoint): Promise<ClosedSession[]>;

/**
 * Returns current limits
 *
 * @param endpoint - Cloudflare worker binding
 * @returns current limits
 */
export function limits(endpoint: BrowserEndpoint): Promise<LimitsResponse>;

declare const playwright: {
  chromium: typeof chromium;
  selectors: typeof selectors;
  request: typeof request;
  devices: typeof devices;
  endpointURLString: typeof endpointURLString;
  connect: typeof connect;
  launch: typeof launch;
  limits: typeof limits;
  sessions: typeof sessions;
  history: typeof history;
  acquire: typeof acquire;
};

export type Playwright = typeof playwright;

export default playwright;
