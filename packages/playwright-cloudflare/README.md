# Playwright for Browser Run

This package is a port of [Playwright](https://github.com/microsoft/playwright/) modified to be compatible with [Cloudflare Workers](https://developers.cloudflare.com/workers/) and [Browser Run](https://developers.cloudflare.com/browser-run/).

## Getting Started

Create a [Cloudflare Worker](https://developers.cloudflare.com/workers/get-started/guide/):

```shell
npm create cloudflare@latest -- cf-playwright-worker
```

## Installation

```shell
npm install @cloudflare/playwright
```

## Configuration

Add the browser binding to your `wrangler.toml`:

```toml
compatibility_flags = ["nodejs_compat"]
browser = { binding = "MYBROWSER" }
```

## CDP Protocol Support

[Browser Run now has full CDP support](https://developers.cloudflare.com/changelog/post/2026-04-10-browser-rendering-cdp-endpoint/), so starting with `@cloudflare/playwright` version 1.3.0, the library uses the standard CDP (Chrome DevTools Protocol) internally to communicate with Browser Run.

Everything should work the same way, but if you encounter any issues, please [report them](https://github.com/cloudflare/playwright/issues). You can also downgrade to a previous playwright version by using `compatibility_date` prior to `2026-03-17` or by adding the `no_websocket_standard_binary_type` flag:

```toml
compatibility_date = "2026-03-16"
# or
compatibility_flags = ["nodejs_compat", "no_websocket_standard_binary_type", ...]
```

See [cloudflare/puppeteer#193](https://github.com/cloudflare/puppeteer/issues/193) and [cloudflare/workerd#6442](https://github.com/cloudflare/workerd/issues/6442) for details.

## Examples

### Screenshot

```ts
import { launch } from '@cloudflare/playwright';

export default {
  async fetch(request, env): Promise<Response> {
    const browser = await launch(env.MYBROWSER);
    const page = await browser.newPage();

    await page.goto('https://demo.playwright.dev/todomvc');

    const TODO_ITEMS = [
      'buy some cheese',
      'feed the cat',
      'book a doctors appointment',
    ];

    const newTodo = page.getByPlaceholder('What needs to be done?');
    for (const item of TODO_ITEMS) {
      await newTodo.fill(item);
      await newTodo.press('Enter');
    }

    const img = await page.screenshot();
    await browser.close();

    return new Response(img, {
      headers: {
        'Content-Type': 'image/png',
      },
    });
  },
} satisfies ExportedHandler<Env>;
```

### Trace

```ts
import fs from 'fs';
import { launch } from '@cloudflare/playwright';

export default {
  async fetch(request, env): Promise<Response> {
    const browser = await launch(env.MYBROWSER);
    const page = await browser.newPage();

    await page.context().tracing.start({ screenshots: true, snapshots: true });

    // ... do something, screenshot for example

    // For now, fs only supports writing into /tmp
    await page.context().tracing.stop({ path: '/tmp/trace.zip' });
    await browser.close();
    const file = await fs.promises.readFile('/tmp/trace.zip');

    return new Response(file, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
      },
    });
  },
} satisfies ExportedHandler<Env>;
```

### Assertions

```ts
import { launch } from '@cloudflare/playwright';
import { expect } from '@cloudflare/playwright/test';

export default {
  async fetch(request, env): Promise<Response> {
    const browser = await launch(env.MYBROWSER);
    const page = await browser.newPage();

    await page.goto('https://demo.playwright.dev/todomvc');

    const TODO_ITEMS = [
      'buy some cheese',
      'feed the cat',
      'book a doctors appointment',
    ];

    const newTodo = page.getByPlaceholder('What needs to be done?');
    for (const item of TODO_ITEMS) {
      await newTodo.fill(item);
      await newTodo.press('Enter');
    }

    await expect(page.getByTestId('todo-title')).toHaveCount(TODO_ITEMS.length);

    await Promise.all(
      TODO_ITEMS.map((value, index) =>
        expect(page.getByTestId('todo-title').nth(index)).toHaveText(value)
      )
    );

    await browser.close();

    return new Response('All assertions passed!');
  },
} satisfies ExportedHandler<Env>;
```

## Unsupported Features

The following capabilities are not fully supported, but we're actively working on them:

- [Playwright Test](https://playwright.dev/docs/test-configuration) except [Assertions](https://playwright.dev/docs/test-assertions)
- [Components](https://playwright.dev/docs/test-components)
- [Firefox](https://playwright.dev/docs/api/class-playwright#playwright-firefox), [Android](https://playwright.dev/docs/api/class-android) and [Electron](https://playwright.dev/docs/api/class-electron), as well as different versions of Chrome
- [Videos](https://playwright.dev/docs/videos)

## Documentation

More information in the [Browser Run developer docs](https://developers.cloudflare.com/browser-run/).
