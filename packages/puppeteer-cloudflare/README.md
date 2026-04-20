# Puppeteer for Browser Run

This package is a port of [Puppeteer](https://github.com/puppeteer/puppeteer) modified to be compatible with [Cloudflare Workers](https://developers.cloudflare.com/workers/) and [Browser Run](https://developers.cloudflare.com/browser-run/).

The goals of the port are:

- Support as much of the existing puppeteer-core library as possible.
- Minimize the size of the library for Workers developers, since library space is at a premium in Workers projects.
- Make library use as seamless as possible in Workers.

## Installation

```shell
npm install @cloudflare/puppeteer
```

## Configuration

Add a browser binding to your Wrangler configuration:

```toml
compatibility_flags = ["nodejs_compat"]
browser = { binding = "MYBROWSER" }
```

## CDP Protocol Support

[Browser Run now has full CDP support](https://developers.cloudflare.com/changelog/post/2026-04-10-browser-rendering-cdp-endpoint/), so starting with `@cloudflare/puppeteer` version 1.1.0, the library uses the standard CDP (Chrome DevTools Protocol) internally to communicate with Browser Run.

Everything should work the same way, but if you encounter any issues, please [report them](https://github.com/cloudflare/puppeteer/issues). You can also downgrade to a previous puppeteer version by using `compatibility_date` prior to `2026-03-17` or by adding the `no_websocket_standard_binary_type` flag:

```toml
compatibility_date = "2026-03-16"
# or
compatibility_flags = ["nodejs_compat", "no_websocket_standard_binary_type", ...]
```

See [cloudflare/puppeteer#193](https://github.com/cloudflare/puppeteer/issues/193) and [cloudflare/workerd#6442](https://github.com/cloudflare/workerd/issues/6442) for details.

## Example

```ts
import puppeteer from '@cloudflare/puppeteer';

export default {
  async fetch(request, env): Promise<Response> {
    const browser = await puppeteer.launch(env.MYBROWSER);
    const page = await browser.newPage();

    await page.goto('https://example.com');
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

## Documentation

More information in the [Browser Run developer docs](https://developers.cloudflare.com/browser-run/).
