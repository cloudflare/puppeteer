/**
 * @license
 * Copyright 2025 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
import type {Browser} from '@cloudflare/puppeteer';

export const test = async (browser: Browser): Promise<Response> => {
  const page = await browser.newPage();

  await Promise.all([
    page.coverage.startJSCoverage(),
    page.coverage.startCSSCoverage(),
  ]);
  // Navigate to page
  await page.goto('https://example.com');
  // Disable both JavaScript and CSS coverage
  const [jsCoverage, cssCoverage] = await Promise.all([
    page.coverage.stopJSCoverage(),
    page.coverage.stopCSSCoverage(),
  ]);
  let totalBytes = 0;
  let usedBytes = 0;
  const coverage = [...jsCoverage, ...cssCoverage];
  for (const entry of coverage) {
    totalBytes += entry.text.length;
    for (const range of entry.ranges) {
      usedBytes += range.end - range.start - 1;
    }
  }

  return new Response(`Bytes used: ${(usedBytes / totalBytes) * 100}%`);
};
