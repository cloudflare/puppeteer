import type {BrowserWorker} from '@cloudflare/puppeteer';
import {connect, launch} from '@cloudflare/puppeteer';
import {expectType} from 'tsd';

declare const endpoint: BrowserWorker;

const launchedBrowser = await launch(endpoint);
expectType<string>(launchedBrowser.sessionId());

const connectedBrowser = await connect(endpoint, 'SESSION_ID');
expectType<string>(connectedBrowser.sessionId());
