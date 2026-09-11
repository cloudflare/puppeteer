# Puppeteer for Browser Run

This package ports [Puppeteer](https://github.com/puppeteer/puppeteer) to [Cloudflare Workers](https://developers.cloudflare.com/workers/) and [Browser Run](https://developers.cloudflare.com/browser-run/).

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

## Example

```ts
import puppeteer from '@cloudflare/puppeteer';

export default {
  async fetch(request, env): Promise<Response> {
    const browser = await puppeteer.launch(env.MYBROWSER);
    const page = await browser.newPage();

    await page.goto('https://example.com');
    const image = await page.screenshot();
    await browser.close();

    return new Response(image, {
      headers: {'Content-Type': 'image/png'},
    });
  },
} satisfies ExportedHandler<Env>;
```

See the [Browser Run documentation](https://developers.cloudflare.com/browser-run/) for more information.
