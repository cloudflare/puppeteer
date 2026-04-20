# Cloudflare Browser Run

This monorepo contains Cloudflare's browser automation libraries for [Browser Run](https://developers.cloudflare.com/browser-run/).

## Packages

| Package | Description |
| --- | --- |
| [`@cloudflare/puppeteer`](./packages/puppeteer-cloudflare) | Puppeteer port for Cloudflare Workers and Browser Run |
| [`@cloudflare/playwright`](./packages/playwright-cloudflare) | Playwright port for Cloudflare Workers and Browser Run |

## Setup

```shell
git submodule update --init
npm ci
npm run build
```

## Upstream Patches

The ports use upstream repositories as Git submodules. Cloudflare-specific changes live in patches under [`patches/`](./patches).

Apply all patches:

```shell
npm run patch
```

Regenerate them after changing the submodules:

```shell
npm run diff
```

## Route selected browser requests through your Worker

Browser Run RPC bindings accept an `outboundByHost` map. Each value is a Worker
Fetcher created by the caller. Browser Run sends requests for that hostname to
the Fetcher, so the request can use the caller's authentication or private
network access.

```ts
const browser = await puppeteer.launch(env.MYBROWSER, {
  outboundByHost: {
    'app.example.com': ctx.exports.MyApp({props: {}}),
  },
});
```

Create the Fetcher and launch the browser in the same Worker invocation. The
map carries live Worker capabilities and is not supported by URL endpoints or
legacy HTTP-only bindings.

More information in the [developer docs](https://developers.cloudflare.com/browser-rendering/).

## License

Apache-2.0
