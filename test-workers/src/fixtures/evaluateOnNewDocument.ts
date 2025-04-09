/**
 * @license
 * Copyright 2025 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
import type {Browser} from '@cloudflare/puppeteer';

export const test = async (browser: Browser): Promise<Response> => {
  const page = await browser.newPage();
  await page.evaluateOnNewDocument(() => {
    function meaningOfLife() {
      return 42;
    }
    (globalThis as any).meaningOfLife = meaningOfLife();
  });
  // Navigate the page to a URL.
  await page.goto('https://developer.chrome.com/');
  const meaningOfLife = await page.evaluate(() => {
    return (globalThis as any).meaningOfLife;
  });
  return new Response(`The meaning of life is ${meaningOfLife}`);
};
