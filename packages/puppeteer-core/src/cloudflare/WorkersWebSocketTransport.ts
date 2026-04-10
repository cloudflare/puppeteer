/**
 * @license
 * Copyright 2025 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
import type {ConnectionTransport} from '../common/ConnectionTransport.js';
import {debugError} from '../common/util.js';
import {packageVersion} from '../generated/version.js';

import type {BrowserWorker} from './BrowserWorker.js';

const FAKE_HOST = 'https://fake.host';

export class WorkersWebSocketTransport implements ConnectionTransport {
  ws: WebSocket;
  onmessage?: (message: string) => void;
  onclose?: () => void;
  sessionId: string;

  static async create(
    endpoint: BrowserWorker,
    sessionId: string
  ): Promise<WorkersWebSocketTransport> {
    const path = `${FAKE_HOST}/v1/devtools/browser/${sessionId}`;
    const response = await endpoint.fetch(path, {
      headers: {
        Upgrade: 'websocket',
        'cf-brapi-client': `@cloudflare/puppeteer@${packageVersion}`,
      },
    });
    response.webSocket!.accept();
    return new WorkersWebSocketTransport(response.webSocket!, sessionId);
  }

  constructor(ws: WebSocket, sessionId: string) {
    this.ws = ws;
    this.sessionId = sessionId;
    this.ws.addEventListener('message', async event => {
      this.onmessage?.(event.data);
    });
    this.ws.addEventListener('close', () => {
      this.onclose?.();
    });
    this.ws.addEventListener('error', e => {
      const message = (e as ErrorEvent).message || 'Unknown error';
      debugError(`WebSocket error: SessionID: ${sessionId} - ${message}`);
    });
  }

  send(message: string): void {
    this.ws.send(message);
  }

  close(): void {
    this.ws.close();
  }

  toString(): string {
    return this.sessionId;
  }
}
