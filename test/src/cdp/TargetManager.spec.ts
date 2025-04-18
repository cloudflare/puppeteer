/**
 * @license
 * Copyright 2022 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import type {CdpBrowser} from '@cloudflare/puppeteer/internal/cdp/Browser.js';
import expect from 'expect';

import {getTestState, launch} from '../mocha-utils.js';
import {attachFrame} from '../utils.js';

describe('TargetManager', () => {
  /* We use a special browser for this test as we need the --site-per-process flag */
  let state: Awaited<ReturnType<typeof launch>> & {
    browser: CdpBrowser;
  };

  beforeEach(async () => {
    const {defaultBrowserOptions} = await getTestState({
      skipLaunch: true,
    });
    state = (await launch(
      Object.assign({}, defaultBrowserOptions, {
        args: (defaultBrowserOptions.args || []).concat([
          '--site-per-process',
          '--remote-debugging-port=21222',
          '--host-rules=MAP * 127.0.0.1',
        ]),
      }),
      {createPage: false}
    )) as Awaited<ReturnType<typeof launch>> & {
      browser: CdpBrowser;
    };
  });

  afterEach(async () => {
    await state.close();
  });

  // CDP-specific test.
  it('should handle targets', async () => {
    const {server, context, browser} = state;

    const targetManager = browser._targetManager();
    expect(targetManager.getAvailableTargets().size).toBe(3);

    expect(await context.pages()).toHaveLength(0);
    expect(targetManager.getAvailableTargets().size).toBe(3);

    const page = await context.newPage();
    expect(await context.pages()).toHaveLength(1);
    expect(targetManager.getAvailableTargets().size).toBe(5);

    await page.goto(server.EMPTY_PAGE);
    expect(await context.pages()).toHaveLength(1);
    expect(targetManager.getAvailableTargets().size).toBe(5);

    // attach a local iframe.
    let framePromise = page.waitForFrame(frame => {
      return frame.url().endsWith('/empty.html');
    });
    await attachFrame(page, 'frame1', server.EMPTY_PAGE);
    await framePromise;
    expect(await context.pages()).toHaveLength(1);
    expect(targetManager.getAvailableTargets().size).toBe(5);
    expect(page.frames()).toHaveLength(2);

    // // attach a remote frame iframe.
    framePromise = page.waitForFrame(frame => {
      return frame.url() === server.CROSS_PROCESS_PREFIX + '/empty.html';
    });
    await attachFrame(
      page,
      'frame2',
      server.CROSS_PROCESS_PREFIX + '/empty.html'
    );
    await framePromise;
    expect(await context.pages()).toHaveLength(1);
    expect(targetManager.getAvailableTargets().size).toBe(6);
    expect(page.frames()).toHaveLength(3);

    framePromise = page.waitForFrame(frame => {
      return frame.url() === server.CROSS_PROCESS_PREFIX + '/empty.html';
    });
    await attachFrame(
      page,
      'frame3',
      server.CROSS_PROCESS_PREFIX + '/empty.html'
    );
    await framePromise;
    expect(await context.pages()).toHaveLength(1);
    expect(targetManager.getAvailableTargets().size).toBe(7);
    expect(page.frames()).toHaveLength(4);
  });
});
