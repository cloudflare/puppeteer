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
import {Puppeteer} from './common/Puppeteer.js';
import {WorkersWebSocketTransport} from './common/WorkersWebSocketTransport.js';
import {BrowserWorker} from './common/BrowserWorker.js';

export * from './common/NetworkConditions.js';
export * from './common/QueryHandler.js';
export * from './common/DeviceDescriptors.js';
export * from './common/Errors.js';

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
        `Unabled to create new browser: code: ${status}: message: ${text}`
      );
    }
    // Note: text is actually a browser session id
    const transport = await WorkersWebSocketTransport.create(endpoint, text);
    return this.connect({transport, sessionId});
  }
}

const puppeteer = new PuppeteerWorkers();
export default puppeteer;

export const {connect, launch} = puppeteer;
