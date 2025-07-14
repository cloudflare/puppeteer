/**
 * @license
 * Copyright 2025 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
import type {Browser} from '@cloudflare/puppeteer';
import { a } from 'vitest/dist/suite-dWqIFb_-.js';

export const test = async (browser: Browser): Promise<Response> => {
  const page = await browser.newPage();

  // Navigate the page to a URL.
  await page.goto('https://pptr.dev/');

  // Set screen size.
  await page.setViewport({width: 1080, height: 1024});

  await page.locator('.DocSearch-Button').click();

  // Type into search box.
  await page.locator('.DocSearch-Input').fill('Getting started');

  // Wait and click on first result.
  await page.locator('.DocSearch-Hit-title:nth-child(1)').click();

  // Locate the full title with a unique string.
  // eslint-disable-next-line rulesdir/use-using
  const textSelector = await page
    .locator('h1 ::-p-text(Getting started)')
    .waitHandle();
  const fullTitle = await textSelector?.evaluate(el => el.textContent.trim());

  return new Response(`The title of this blog post is ${fullTitle}`);
};
