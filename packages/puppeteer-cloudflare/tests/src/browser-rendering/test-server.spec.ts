import expect from 'expect';

import {getTestState} from '../server/mocha-utils.js';

describe('Worker TestServer', () => {
  it('serves routes and observes requests', async () => {
    const {page, server} = getTestState();
    server.setRoute('/dynamic', (_request, response) => {
      response.setHeader('x-test-server', 'route');
      response.setHeader(
        'set-cookie',
        'test-server=route; Secure; HttpOnly; Path=/',
      );
      response.end('dynamic body');
    });

    const [request, response] = await Promise.all([
      server.waitForRequest('/dynamic'),
      page.goto(`${server.PREFIX}/dynamic`),
    ]);

    expect(request.method).toBe('GET');
    expect(response!.headers()['x-test-server']).toBe('route');
    expect(await response!.text()).toBe('dynamic body');
    // The zone also sets its Bot Management cookie (__cf_bm) on this response.
    const setCookies = (response!.headers()['set-cookie'] ?? '')
      .split('\n')
      .filter(cookie => {
        return !cookie.startsWith('__cf_bm=');
      });
    expect(setCookies).toEqual([
      expect.stringContaining('test-server=route'),
    ]);
    expect(await page.cookies()).toMatchObject([
      {name: 'test-server', value: 'route', httpOnly: true, secure: true},
    ]);
  });

  it('serves redirects', async () => {
    const {page, server} = getTestState();
    server.setRedirect('/redirect', '/empty.html');

    const response = await page.goto(`${server.PREFIX}/redirect`);

    expect(response!.url()).toBe(server.EMPTY_PAGE);
    expect(response!.ok()).toBe(true);
  });

  it('adds CSP to asset responses', async () => {
    const {page, server} = getTestState();
    server.setCSP('/empty.html', "default-src 'self'");

    const response = await page.goto(server.EMPTY_PAGE);

    expect(response!.headers()['content-security-policy']).toBe(
      "default-src 'self'",
    );
  });

  it('shares routes with the HTTPS facade', async () => {
    const {httpsServer, page} = getTestState();
    httpsServer.setRoute('/https-route', (_request, response) => {
      response.end('https route');
    });

    const response = await page.goto(`${httpsServer.PREFIX}/https-route`);

    expect(await response!.text()).toBe('https route');
  });

  it('preserves routing when tests set extra headers', async () => {
    const {page, server} = getTestState();
    server.setRoute('/extra-headers', (_request, response) => {
      response.end('routed');
    });
    await page.setExtraHTTPHeaders({'x-test-header': 'value'});

    const response = await page.goto(`${server.PREFIX}/extra-headers`);

    expect(await response!.text()).toBe('routed');
  });

  it('keeps request waiters after rejecting a large body', async () => {
    const {page, server} = getTestState();
    await page.goto(server.EMPTY_PAGE);
    const requestPromise = server.waitForRequest('/body-limit');
    const url = `${server.PREFIX}/body-limit`;

    const status = await page.evaluate(async url => {
      return await fetch(url, {
        method: 'POST',
        body: 'x'.repeat(1024 * 1024 + 1),
      }).then(response => {
        return response.status;
      });
    }, url);
    expect(status).toBe(413);

    await page.evaluate(async url => {
      await fetch(url, {method: 'POST', body: 'accepted'});
    }, url);
    expect(await (await requestPromise).postBody).toBe('accepted');
  });

  it('routes direct TestServer URLs to the active object', async () => {
    const {page, server} = getTestState();
    server.setRoute('/direct-route', (_request, response) => {
      response.end('direct');
    });
    const requestPromise = server.waitForRequest('/direct-route');
    await page.goto(`${server.PREFIX}/direct-route`);
    const request = await requestPromise;
    const routeId = request.headers['x-puppeteer-test-server'];

    const response = await page.goto(
      `${server.PREFIX}/__puppeteer_test__/${encodeURIComponent(routeId!)}/http/direct-route`,
    );

    expect(await response!.text()).toBe('direct');
  });
});
