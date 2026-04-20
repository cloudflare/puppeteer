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

## License

Apache-2.0
