/**
 * @license
 * Copyright 2025 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
import type {Browser} from '@cloudflare/puppeteer';

export const test = async (browser: Browser): Promise<Response> => {
  const page = await browser.newPage();

  // Navigate the page to a URL.
  await page.goto('https://developer.chrome.com/');

  // Set screen size.
  await page.setViewport({width: 1080, height: 1024});

  // Type into search box.
  await page.locator('.devsite-search-field').fill('automate beyond recorder');

  // Wait and click on first result.
  await page.locator('.devsite-suggest-all-results').click();

  // Locate the full title with a unique string.
  // eslint-disable-next-line rulesdir/use-using
  const textSelector = await page
    .locator('h1 ::-p-text(Search results)')
    .waitHandle();
  const fullTitle = await textSelector?.evaluate(el => {
    return el.textContent;
  });

  return new Response(`The title of this blog post is ${fullTitle}`);
};
