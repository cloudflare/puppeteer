// @ts-expect-error internal types missing
import {testSuites} from '@cloudflare/playwright/internal';

import type {TestsServer} from './testsServer.js';
import { getBinding } from './utils.js';

export {TestsServer} from './testsServer';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname.startsWith('/v1')) {
      return await getBinding(url).fetch(`http://fake.host${url.pathname}`);
    }
    if (url.pathname === '/') {
      return Response.json(await testSuites());
    }

    const bindingName = url.searchParams.get('binding') ?? 'BROWSER';

    if (/\.(spec|test)\.ts$/.test(url.pathname)) {
      const sessionId = url.searchParams.get('sessionId');
      if (!sessionId) {
        return new Response('sessionId is required', {status: 400});
      }
      const id = env.TESTS_SERVER.idFromName(`${bindingName}_${sessionId}`);
      const testsServer = env.TESTS_SERVER.get(
        id,
      ) as DurableObjectStub<TestsServer>;
      return await testsServer.fetch(request);
    }

    if (url.pathname === '/index.html') {
      // let's use empty.html for index.html
      request = new Request(request.url.replace(/\/index\.html$/, '/empty'));
    } else if (url.pathname.endsWith('.html')) {
      // assets serve html files without .html extension
      request = new Request(
        request.url.substring(0, request.url.length - '.html'.length),
      );
    }

    return (
      (await env.ASSETS?.fetch(request)) ??
      new Response('Not found', {status: 404})
    );
  },
};
