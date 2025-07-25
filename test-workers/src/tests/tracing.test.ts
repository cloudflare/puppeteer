/**
 * @license
 * Copyright 2025 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
import {describe, it} from 'vitest';

describe('browser takes screenshot', () => {
  it('take sceenshot of example.com', async ({expect}) => {
    await new Promise(resolve => {
      setTimeout(resolve, 30000);
    });
    const response = await fetch(
      `https://puppeteer-test-worker.cloudflare-browser-rendering-085.workers.dev/tracing`
    );
    expect(!!JSON.parse(await response.text())).toMatchSnapshot();
  });
});
