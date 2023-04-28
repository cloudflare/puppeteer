/**
 * Copyright 2019 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import expect from 'expect';
import {IncomingMessage} from 'http';
import {
  getTestState,
  setupTestBrowserHooks,
  setupTestPageAndContextHooks,
  describeChromeOnly,
} from './mocha-utils.js';

describeChromeOnly('Chromium-Specific Launcher tests', function () {
  describe('Puppeteer.launch |pipe| option', function () {
    it('should support the pipe option', async () => {
      const {defaultBrowserOptions, puppeteer} = getTestState();
      const options = Object.assign({pipe: true}, defaultBrowserOptions);
      const browser = await puppeteer.launch(options);
      expect((await browser.pages()).length).toBe(1);
      expect(browser.wsEndpoint()).toBe('');
      const page = await browser.newPage();
      expect(await page.evaluate('11 * 11')).toBe(121);
      await page.close();
      await browser.close();
    });
    it('should support the pipe argument', async () => {
      const {defaultBrowserOptions, puppeteer} = getTestState();
      const options = Object.assign({}, defaultBrowserOptions);
      options.args = ['--remote-debugging-pipe'].concat(options.args || []);
      const browser = await puppeteer.launch(options);
      expect(browser.wsEndpoint()).toBe('');
      const page = await browser.newPage();
      expect(await page.evaluate('11 * 11')).toBe(121);
      await page.close();
      await browser.close();
    });
    it('should fire "disconnected" when closing with pipe', async () => {
      const {defaultBrowserOptions, puppeteer} = getTestState();
      const options = Object.assign({pipe: true}, defaultBrowserOptions);
      const browser = await puppeteer.launch(options);
      const disconnectedEventPromise = new Promise(resolve => {
        return browser.once('disconnected', resolve);
      });
      // Emulate user exiting browser.
      browser.process()!.kill();
      await disconnectedEventPromise;
    });
  });
});

describeChromeOnly('Chromium-Specific Page Tests', function () {
  setupTestBrowserHooks();
  setupTestPageAndContextHooks();
  it('Page.setRequestInterception should work with intervention headers', async () => {
    const {server, page} = getTestState();

    server.setRoute('/intervention', (_req, res) => {
      return res.end(`
        <script>
          document.write('<script src="${server.CROSS_PROCESS_PREFIX}/intervention.js">' + '</scr' + 'ipt>');
        </script>
      `);
    });
    server.setRedirect('/intervention.js', '/redirect.js');
    let serverRequest: IncomingMessage | undefined;
    server.setRoute('/redirect.js', (req, res) => {
      serverRequest = req;
      res.end('console.log(1);');
    });

    await page.setRequestInterception(true);
    page.on('request', request => {
      return request.continue();
    });
    await page.goto(server.PREFIX + '/intervention');
    // Check for feature URL substring rather than https://www.chromestatus.com to
    // make it work with Edgium.
    expect(serverRequest!.headers['intervention']).toContain(
      'feature/5718547946799104'
    );
  });
});
