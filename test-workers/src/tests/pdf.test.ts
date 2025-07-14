/**
 * @license
 * Copyright 2025 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
import {describe, it} from 'vitest';

describe('browser pdf', () => {
  it('gets pdf of example.com', async ({expect}) => {
    await new Promise(resolve => {
      setTimeout(resolve, 30000);
    });
    const response = await fetch(
      `https://puppeteer-test-worker.cloudflare-browser-rendering-085.workers.dev/pdf`
    );
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('application/pdf');
  });
});
