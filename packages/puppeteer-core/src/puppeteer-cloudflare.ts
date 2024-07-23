import {PuppeteerWorkers} from './cloudflare/PuppeteerWorkers.js';
export * from './api/api.js';
export * from './common/common.js';
export * from './revisions.js';
export * from './util/util.js';

const puppeteer = new PuppeteerWorkers();

export const {connect, history, launch, limits, sessions} = puppeteer;

export type * from './cloudflare/PuppeteerWorkers.js';

export default puppeteer;
