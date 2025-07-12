/**
 * @license
 * Copyright 2025 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
import type {Browser} from '@cloudflare/puppeteer';

export const test = async (browser: Browser): Promise<Response> => {
  const page = await browser.newPage();

  const response = await page.goto('https://example.com/');
  const html = await response!.text();

  return new Response(html, {
    headers: {
      'content-type': 'application/text',
    },
  });
};
