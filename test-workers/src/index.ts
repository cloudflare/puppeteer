/**
 * @license
 * Copyright 2025 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
import puppeteer from '@cloudflare/puppeteer';

import {test as basicInteractions} from './fixtures/basic-interactions.js';
import {test as coverageTest} from './fixtures/coverage.js';
import {test as evaluateTest} from './fixtures/evaluate.js';
import {test as evaluateOnNewDocumentTest} from './fixtures/evaluateOnNewDocument.js';
import {test as htmlTest} from './fixtures/html.js';
import {test as imageTest} from './fixtures/image.js';
import {test as pdfTest} from './fixtures/pdf.js';
import {test as tracingTest} from './fixtures/tracing.js';

const testsMap = {
  image: imageTest,
  pdf: pdfTest,
  html: htmlTest,
  'basic-interactions': basicInteractions,
  tracing: tracingTest,
  coverage: coverageTest,
  evaluate: evaluateTest,
  evaluateOnNewDocument: evaluateOnNewDocumentTest,
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url).pathname.slice(1) as
      | keyof typeof testsMap
      | undefined;
    if (!url || !(url in testsMap)) {
      return new Response(`Test "${url}" does not exist`, {
        status: 500,
      });
    }
    const browser = await puppeteer.launch(env.BROWSER);

    const response = await testsMap[url](browser);
    await browser.close();
    return response;
  },
};

// page content
