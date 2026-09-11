# Cloudflare Browser Run

This monorepo contains Cloudflare's browser automation libraries for [Browser Run](https://developers.cloudflare.com/browser-run/).

## Packages

| Package | Description |
| --- | --- |
| [`@cloudflare/puppeteer`](./packages/puppeteer-cloudflare) | Puppeteer port for Cloudflare Workers and Browser Run |

More browser automation ports and shared packages will move into this repository over time.

## Setup

```shell
git submodule update --init
npm ci
npm run build
```

## Upstream Patches

The ports use unmodified upstream repositories as Git submodules. Cloudflare-specific changes live in small patches under [`patches/`](./patches).

Apply the Puppeteer patch:

```shell
npm run patch:puppeteer
```

Regenerate it after changing the submodule:

```shell
npm run diff:puppeteer
```

## License

Apache-2.0
