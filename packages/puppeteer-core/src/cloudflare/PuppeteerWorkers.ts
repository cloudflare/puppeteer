/**
 * Copyright 2020 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import './globalPatcher.js';

import {Browser} from '../api/Browser.js';
import {ConnectionTransport} from '../common/ConnectionTransport.js';
import {Puppeteer} from '../common/Puppeteer.js';

import {BrowserWorker} from './BrowserWorker.js';
import {connectToCDPBrowser} from './utils.js';
import {WorkersWebSocketTransport} from './WorkersWebSocketTransport.js';

const FAKE_HOST = 'https://fake.host';

// We can't include both workers-types and dom because they conflict
declare global {
  interface Response {
    readonly webSocket: WebSocket | null;
  }
  interface WebSocket {
    accept(): void;
  }
}
/**
 * @public
 */
export interface AcquireResponse {
  sessionId: string;
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
  connectionStartTime?: string;
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
}
/**
 * @public
 */
export class PuppeteerWorkers extends Puppeteer {
  public constructor() {
    super({isPuppeteerCore: false});
    this.connect = this.connect.bind(this);
    this.launch = this.launch.bind(this);
    this.sessions = this.sessions.bind(this);
    this.history = this.history.bind(this);
    this.limits = this.limits.bind(this);
  }

  /**
   * Launch a browser session.
   *
   * @param endpoint - Cloudflare worker binding
   * @returns a browser session or throws
   */
  public async launch(
    endpoint: BrowserWorker,
    options?: WorkersLaunchOptions
  ): Promise<Browser> {
    let acquireUrl = `${FAKE_HOST}/v1/acquire`;
    if (options?.keep_alive) {
      acquireUrl = `${acquireUrl}?keep_alive=${options.keep_alive}`;
    }
    const res = await endpoint.fetch(acquireUrl);
    const status = res.status;
    const text = await res.text();
    if (status !== 200) {
      throw new Error(
        `Unable to create new browser: code: ${status}: message: ${text}`
      );
    }
    // Got a 200, so response text is actually an AcquireResponse
    const response: AcquireResponse = JSON.parse(text);
    return this.connect(endpoint, response.sessionId);
  }

  /**
   * Returns active sessions
   *
   * @remarks
   * Sessions with a connnectionId already have a worker connection established
   *
   * @param endpoint - Cloudflare worker binding
   * @returns List of active sessions
   */
  public async sessions(endpoint: BrowserWorker): Promise<ActiveSession[]> {
    const res = await endpoint.fetch(`${FAKE_HOST}/v1/sessions`);
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

  /**
   * Returns recent sessions (active and closed)
   *
   * @param endpoint - Cloudflare worker binding
   * @returns List of recent sessions (active and closed)
   */
  public async history(endpoint: BrowserWorker): Promise<ClosedSession[]> {
    const res = await endpoint.fetch(`${FAKE_HOST}/v1/history`);
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

  /**
   * Returns current limits
   *
   * @param endpoint - Cloudflare worker binding
   * @returns current limits
   */
  public async limits(endpoint: BrowserWorker): Promise<LimitsResponse> {
    const res = await endpoint.fetch(`${FAKE_HOST}/v1/limits`);
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

  /**
   * Establish a devtools connection to an existing session
   *
   * @param endpoint - Cloudflare worker binding
   * @param sessionId - sessionId obtained from a .sessions() call
   * @returns a browser instance
   */
  // @ts-expect-error we use a diferent input here and completly ignore the original class
  public override async connect(
    endpoint: BrowserWorker,
    sessionId: string
  ): Promise<Browser>;

  /**
   * Establish a devtools connection to an existing session
   *
   * @param borwserWorker - BrowserWorker
   * @returns a browser instance
   */
  // @ts-expect-error we use a diferent input here and completly ignore the original class
  public override async connect(
    endpoint: BrowserWorker,
    sessionId: string
  ): Promise<Browser> {
    try {
      const connectionTransport: ConnectionTransport =
        await WorkersWebSocketTransport.create(endpoint, sessionId);
      return connectToCDPBrowser(connectionTransport, {sessionId});
    } catch (e) {
      throw new Error(
        `Unable to connect to existing session ${sessionId} (it may still be in use or not ready yet) - retry or launch a new browser: ${e}`
      );
    }
  }
}
