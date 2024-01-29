/**
 * Copyright 2017 Google Inc. All rights reserved.
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

// import {initializePuppeteer} from './initializePuppeteer.js';
import {Browser} from './common/Browser.js';
import {BrowserWorker} from './common/BrowserWorker.js';
import {Puppeteer} from './common/Puppeteer.js';
import {WorkersWebSocketTransport} from './common/WorkersWebSocketTransport.js';

export * from './common/NetworkConditions.js';
export * from './common/QueryHandler.js';
export * from './common/DeviceDescriptors.js';
export * from './common/Errors.js';
export {BrowserWorker} from './common/BrowserWorker.js';

// initializePuppeteer('puppeteer-core');

/* Original singleton and exports
 * We redefine below
export const {
  connect,
  createBrowserFetcher,
  defaultArgs,
  executablePath,
  launch,
} = puppeteer;

export default puppeteer;
*/

// We can't include both workers-types and dom because they conflict
declare global {
  interface Response {
    readonly webSocket: WebSocket | null;
  }
  interface WebSocket {
    accept(): void;
  }
}

interface AcquireResponse {
  sessionId: string;
}

interface ActiveSession {
  sessionId: string;
  startTime: number; // timestamp
}

interface ClosedSession extends ActiveSession {
  endTime: number; // timestamp
  closeReason: number; // close reason code
  closeReasonText: string; // close reason description
}

interface SessionsResponse {
  sessions: ActiveSession[]
}

interface HistoryResponse {
  history: ClosedSession[];
}

class PuppeteerWorkers extends Puppeteer {
  public constructor() {
    super({isPuppeteerCore: true});
    this.connect = this.connect.bind(this);
    this.launch = this.launch.bind(this);
  }

  public async launch(endpoint: BrowserWorker): Promise<Browser> {
    const res = await endpoint.fetch('/v1/acquire');
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

  // Returns active sessions (may or may not have clients connected)
  async sessions(endpoint: BrowserWorker) {
    const res = await endpoint.fetch('/v1/sessions');
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

  // Returns recent sessions
  async history(endpoint: BrowserWorker) {
    const res = await endpoint.fetch('/v1/history');
    const status = res.status;
    const text = await res.text();
    if (status !== 200) {
      throw new Error(
        `Unable to fetch session history: code: ${status}: message: ${text}`
      );
    }
    const data: HistoryResponse = JSON.parse(text);
    return data.history;
}

  // @ts-ignore
  override async connect(endpoint: BrowserWorker, sessionId: string): Promise<Browser> {
    try {
      const transport = await WorkersWebSocketTransport.create(endpoint, sessionId);
      return super.connect({ transport, sessionId: sessionId });
    } catch (e) {
      throw new Error(
        `Unable to connect to existing session ${sessionId} (it may still be in use or not ready yet) - retry or launch a new browser: ${e}`
      );
    }
  }
}

const puppeteer = new PuppeteerWorkers();
export default puppeteer;

export const {connect, launch} = puppeteer;
