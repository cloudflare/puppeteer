/**
 * @license
 * Copyright 2018 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
import NodeWebSocket from 'ws';
import {ConnectionTransport} from '../../../lib/cjs/puppeteer/common/ConnectionTransport.js';
import {packageVersion} from '../../../lib/cjs/puppeteer/generated/version.js';

/**
 * @internal
 */
export class NodeWebSocketTransport implements ConnectionTransport {
  static create(
    url: string,
    headers?: Record<string, string>
  ): Promise<NodeWebSocketTransport> {
    return new Promise((resolve, reject) => {
      const ws = new NodeWebSocket(url, [], {
        followRedirects: true,
        perMessageDeflate: false,
        maxPayload: 256 * 1024 * 1024, // 256Mb
        headers: {
          'User-Agent': `Puppeteer ${packageVersion}`,
          ...headers,
        },
      });

      ws.addEventListener('open', () => {
        return resolve(new NodeWebSocketTransport(ws));
      });
      ws.addEventListener('error', reject);
    });
  }

  #ws: NodeWebSocket;
  onmessage?: (message: NodeWebSocket.Data) => void;
  onclose?: () => void;

  constructor(ws: NodeWebSocket) {
    this.#ws = ws;
    this.#ws.addEventListener('message', event => {
      setImmediate(() => {
        if (this.onmessage) {
          this.onmessage.call(null, event.data);
        }
      });
    });
    this.#ws.addEventListener('close', () => {
      setImmediate(() => {
        if (this.onclose) {
          this.onclose.call(null);
        }
      });
    });
    // Silently ignore all errors - we don't know what to do with them.
    this.#ws.addEventListener('error', () => {});
  }

  send(message: string): void {
    this.#ws.send(message);
  }

  close(): void {
    this.#ws.close();
  }
}
