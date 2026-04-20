/**
 * @license
 * Copyright 2025 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
import {PuppeteerWorkers} from './cloudflare/PuppeteerWorkers.js';
// Side-effect import: registers the Cloudflare.* CDP command augmentation of
// ProtocolMapping.Commands so session.send('Cloudflare.*', ...) is typed.
import './cloudflare/protocol.js';
export * from 'puppeteer-core/lib/api/api.js';
export * from 'puppeteer-core/lib/common/common.js';
export * from 'puppeteer-core/lib/revisions.js';
export * from 'puppeteer-core/lib/util/util.js';
export * from './cloudflare/BrowserWorker.js';
export * from './cloudflare/protocol.js';

const puppeteer = new PuppeteerWorkers();

export const {connect, history, launch, limits, sessions, acquire} = puppeteer;

export * from './cloudflare/PuppeteerWorkers.js';

export default puppeteer;
