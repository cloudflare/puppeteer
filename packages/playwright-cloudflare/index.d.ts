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
export interface SessionGuardrails {
  /**
   * Hostname patterns the browser may access, max 50.
   *
   * @remarks
   * Each entry is a bare hostname (no scheme, port or path) and may contain a
   * single `*` wildcard. Prefer `*.example.com` (subdomain wildcard) over
   * `*example.com` (prefix wildcard), which also matches lookalikes such as
   * `evilexample.com`.
   */
  allowedDomains?: string[];
  /**
   * Preset names or HTTPS URLs of newline-separated hostname lists, max 4.
   *
   * @remarks
   * The available preset is `common-cdns`.
   */
  allowedDomainSets?: string[];
}

/**
 * @public
 */
export interface BrowserWorker {
  fetch: typeof fetch;
  launch?: (options?: BrowserRunOptions) => Promise<BrowserRunConnection>;
  acquire?: (options?: BrowserRunOptions) => Promise<AcquireResponse>;
  connectSession?: (sessionId: string, options?: BrowserRunConnectOptions) => Promise<BrowserRunConnection>;
}

export type BrowserEndpoint = BrowserWorker | string | URL;

/**
 * @public
 */
export interface AcquireResponse {
  sessionId: string;
  webSocketDebuggerUrl?: string;
  targets?: BrowserRunTarget[];
}

/**
 * @public
 */
export interface BrowserRunTarget {
  id: string;
  type: string;
  url: string;
  title?: string;
  description?: string;
  webSocketDebuggerUrl?: string;
  devtoolsFrontendUrl?: string;
}

/**
 * @public
 */
export interface ActiveSession {
  sessionId: string;
  startTime: number; // timestamp
  // connection info, if present means there's a connection established
  // from a worker to that session
  connectionId?: string;
  connectionStartTime?: number;
}

/**
 * @public
 */
export interface ClosedSession extends ActiveSession {
  endTime: number; // timestamp
  closeReason: number; // close reason code
  closeReasonText: string; // close reason description
}

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
export interface LimitsResponse {
  activeSessions: Array<{id: string}>;
  maxConcurrentSessions: number;
  allowedBrowserAcquisitions: number; // 1 if allowed, 0 otherwise
  timeUntilNextAllowedBrowserAcquisition: number;
}

/**
 * @public
 */
export interface WorkersLaunchOptions {
  keep_alive?: number; // milliseconds to keep browser alive even if it has no activity (from 10_000ms to 600_000ms, default is 60_000)
  recording?: boolean;
  lab?: boolean;
  browser?: 'kitesurf'; // when set to 'kitesurf', no session is acquired and the connection is made directly to /v1/devtools/browser
  outboundByHost?: Record<string, BrowserWorker>;
  // restricts the outbound traffic of the session being acquired, latched for
  // its lifetime
  guardrails?: SessionGuardrails;
}

/**
 * Options accepted by Browser Run's RPC binding methods. The RPC surface uses
 * camelCase and does not accept URL-only options such as `browser` or
 * `persistent`.
 *
 * @public
 */
export interface BrowserRunOptions {
  keepAlive?: number;
  recording?: boolean;
  lab?: boolean;
  location?: string;
  guardrails?: SessionGuardrails;
  outboundByHost?: Record<string, BrowserWorker>;
  targets?: boolean;
  liveViewUrlExpiresInMs?: number;
}

/**
 * @public
 */
export interface WorkersConnectOptions {
  sessionId: string; // session ID to connect to
}

/**
 * @public
 */
export interface BrowserRunConnectOptions {
  targetId?: string;
}

/**
 * @public
 */
export interface BrowserRunConnection {
  sessionId: string;
  webSocket: BrowserWorker;
  webSocketDebuggerUrl?: string;
  targets?: BrowserRunTarget[];
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
