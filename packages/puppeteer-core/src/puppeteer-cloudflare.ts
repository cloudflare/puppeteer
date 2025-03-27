import {PuppeteerWorkers} from './cloudflare/PuppeteerWorkers.js';
export * from './api/api.js';
export * from './common/common.js';
export * from './revisions.js';
export * from './util/util.js';
export * from './cloudflare/BrowserWorker.js';

const puppeteer = new PuppeteerWorkers();

export const {connect, history, launch, limits, sessions} = puppeteer;

export * from './cloudflare/PuppeteerWorkers.js';

export default puppeteer;
