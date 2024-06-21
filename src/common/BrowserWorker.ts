import {type Fetcher} from '@cloudflare/workers-types';

export interface BrowserWorker {
  fetch: Fetcher['fetch'];
}
