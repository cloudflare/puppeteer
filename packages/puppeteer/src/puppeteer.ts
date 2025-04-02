/**
 * @license
 * Copyright 2017 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

export {Protocol} from '@cloudflare/puppeteer/internal/puppeteer-core.js';

export * from '@cloudflare/puppeteer/internal/puppeteer-core.js';

import {PuppeteerNode} from '@cloudflare/puppeteer/internal/node/PuppeteerNode.js';

import {getConfiguration} from './getConfiguration.js';

const configuration = getConfiguration();

/**
 * @public
 */
const puppeteer = new PuppeteerNode({
  isPuppeteerCore: false,
  configuration,
});

export const {
  /**
   * @public
   */
  connect,
  /**
   * @public
   */
  defaultArgs,
  /**
   * @public
   */
  executablePath,
  /**
   * @public
   */
  launch,
  /**
   * @public
   */
  trimCache,
} = puppeteer;

export default puppeteer;
