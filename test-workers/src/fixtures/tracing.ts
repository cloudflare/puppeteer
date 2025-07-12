/**
 * @license
 * Copyright 2025 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
import type {Browser} from '@cloudflare/puppeteer';

export const test = async (browser: Browser): Promise<Response> => {
  const page = await browser.newPage();
  await page.tracing.start();
  await page.goto('https://example.com/');

  const result = await page.tracing.stop();

  return new Response(result?.toString());
};
