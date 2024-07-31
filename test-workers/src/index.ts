import * as puppeteer from 'puppeteer-core';

import {test as basicInteractions} from './fixtures/basic-interactions.js';
import {test as coverageTest} from './fixtures/coverage.js';
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
};

export default {
  async fetch(request: Request, env): Promise<Response> {
    const url = new URL(request.url).pathname.slice(1) as
      | keyof typeof testsMap
      | undefined;
    console.log('path');
    console.log(new URL(request.url).pathname.slice(1));
    if (!url || !(url in testsMap)) {
      return new Response(`Test "${url}" does not exist`, {
        status: 500,
      });
    }
    // @ts-expect-error miss type not sure why
    const browser = await puppeteer.launch(env.BROWSER);

    const response = await testsMap[url](browser);
    await browser.close();
    return response;
  },
} satisfies ExportedHandler<Env>;

// page content
