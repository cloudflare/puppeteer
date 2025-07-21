/**
 * @license
 * Copyright 2025 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
import type {Browser} from '@cloudflare/puppeteer';

export const test = async (browser: Browser): Promise<Response> => {
  const page = await browser.newPage();

  await page.setContent('<h1>Hello, World!</h1>');
  await page.waitForSelector('xpath///h1[text()="Hello, World!"]');
  const content = await page.$eval('xpath///h1[text()="Hello, World!"]', e => {
    return e.textContent;
  });

  return new Response(content, {
    headers: {
      'content-type': 'plain/text',
    },
  });
};
