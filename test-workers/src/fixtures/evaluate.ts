/**
 * @license
 * Copyright 2025 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
import type {Browser} from '@cloudflare/puppeteer';

export const test = async (browser: Browser): Promise<Response> => {
  const page = await browser.newPage();

  const meaningOfLife = await page.evaluate(() => {
    function meaningOfLife() {
      return 42;
    }
    return meaningOfLife();
  });
  return new Response(`The meaning of life is ${meaningOfLife}`);
};
