/**
 * @license
 * Copyright 2025 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
import {describe, it} from 'vitest';

describe('browser evaluateOnNewDocument', () => {
  it('evaluates function with inner function on new document', async ({
    expect,
  }) => {
    await new Promise(resolve => {
      setTimeout(resolve, 30000);
    });
    const response = await fetch(
      `https://puppeteer-test-worker.cloudflare-browser-rendering-085.workers.dev/evaluateOnNewDocument`
    );
    expect(await response.text()).toMatchSnapshot();
  });
});
