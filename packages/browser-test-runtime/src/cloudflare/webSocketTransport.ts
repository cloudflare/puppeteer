import {AsyncLocalStorage} from 'async_hooks';

import type {
  ConnectionTransport,
  ProtocolRequest,
  ProtocolResponse,
} from 'playwright-core/lib/server/transport';

export const transportZone = new AsyncLocalStorage<WebSocketTransport>();

export class WebSocketTransport implements ConnectionTransport {
  private readonly ws: WebSocket;
  onmessage?: (message: ProtocolResponse) => void;
  onclose?: () => void;
  readonly sessionId: string | undefined;

  static async connect(): Promise<WebSocketTransport> {
    const transport = transportZone.getStore();
    if (!transport) {
      throw new Error('Transport is not available in the current zone');
    }
    return transport;
  }

  constructor(ws: WebSocket, sessionId: string | undefined) {
    this.ws = ws;
    this.sessionId = sessionId;
    this.ws.addEventListener('message', event => {
      this.onmessage?.(JSON.parse(event.data) as ProtocolResponse);
    });
    this.ws.addEventListener('close', () => this.onclose?.());
    this.ws.addEventListener('error', error => {
      console.error(
        `Websocket error${sessionId ? `: SessionID: ${sessionId}` : ''}`,
        error,
      );
    });
  }

  send(message: ProtocolRequest): void {
    this.ws.send(JSON.stringify(message));
  }

  close(): void {
    this.ws.close();
    this.onclose?.();
  }

  async closeAndWait() {
    if (this.ws.readyState !== WebSocket.CLOSED) {
      this.close();
    }
  }

  toString(): string {
    return this.sessionId ?? '';
  }
}
