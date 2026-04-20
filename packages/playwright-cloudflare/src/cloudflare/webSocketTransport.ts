import { AsyncLocalStorage } from 'async_hooks';

import type { ConnectionTransport, ProtocolRequest, ProtocolResponse } from 'playwright-core/lib/server/transport';

// stores the endpoint and options for client -> server communication
export const transportZone = new AsyncLocalStorage<WebSocketTransport>();

export class WebSocketTransport implements ConnectionTransport {
  private _ws: WebSocket;
  onmessage?: (message: ProtocolResponse) => void;
  onclose?: () => void;
  readonly sessionId: string | undefined;

  static async connect(): Promise<WebSocketTransport> {
    // read the endpoint and options injected in cliend side
    const transport = transportZone.getStore();
    if (!transport)
      throw new Error('Transport is not available in the current zone');
    return transport;
  }

  constructor(ws: WebSocket, sessionId: string | undefined) {
    this._ws = ws;
    this.sessionId = sessionId;
    this._ws.addEventListener('message', event => {
      this.onmessage?.(JSON.parse(event.data) as ProtocolResponse);
    });
    this._ws.addEventListener('close', () => {
      this.onclose?.();
    });
    this._ws.addEventListener('error', e => {
      // eslint-disable-next-line no-console
      console.error(`Websocket error${sessionId ? `: SessionID: ${sessionId}` : ''}`, e);
    });
  }

  send(message: ProtocolRequest): void {
    this._ws.send(JSON.stringify(message));
  }

  close(): void {
    this._ws.close();
    this.onclose?.();
  }

  async closeAndWait() {
    if (this._ws.readyState === WebSocket.CLOSED)
      return;
    this.close();
    // TODO wait for close event
  }

  toString(): string {
    return this.sessionId ?? '';
  }
}
