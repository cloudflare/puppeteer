import {ConnectionTransport} from './ConnectionTransport.js';
import {messageToChunks, chunksToMessage} from './chunking.js';
import {BrowserWorker} from './BrowserWorker.js';

export class WorkersWebSocketTransport implements ConnectionTransport {
  ws: WebSocket;
  pingInterval: NodeJS.Timer;
  chunks: Uint8Array[] = [];
  onmessage?: (message: string) => void;
  onclose?: () => void;

  static async create(
    endpoint: BrowserWorker,
    sessionid: string
  ): Promise<WorkersWebSocketTransport> {
    const path = `/v1/connectDevtools?browser_session=${sessionid}`;
    const response = await endpoint.fetch(path, {
      headers: {Upgrade: 'websocket'},
    });
    response.webSocket!.accept();
    return new WorkersWebSocketTransport(response.webSocket!, sessionid);
  }

  constructor(ws: WebSocket, sessionid: string) {
    this.pingInterval = setInterval(() => {
      return this.ws.send('ping');
    }, 1000); // TODO more investigation
    this.ws = ws;
    this.ws.addEventListener('message', event => {
      this.chunks.push(new Uint8Array(event.data as ArrayBuffer));
      const message = chunksToMessage(this.chunks, sessionid);
      if (message && this.onmessage) {
        this.onmessage!(message);
      }
    });
    this.ws.addEventListener('close', () => {
      console.log('websocket closed'); // TODO remove
      clearInterval(this.pingInterval);
      if (this.onclose) {
        this.onclose();
      }
    });
    this.ws.addEventListener('error', e => {
      console.error(`Websocket error: SessionID: ${sessionid}`, e);
      clearInterval(this.pingInterval);
    });
  }

  send(message: string): void {
    for (const chunk of messageToChunks(message)) {
      this.ws.send(chunk);
    }
  }

  close(): void {
    console.log('closing websocket'); // TODO remove
    clearInterval(this.pingInterval);
    this.ws.close();
  }
}
