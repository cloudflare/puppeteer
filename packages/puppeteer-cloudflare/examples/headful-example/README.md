# Headful Browser Rendering Example

This example demonstrates how to run Chrome in headful (visible) mode when developing locally with the Browser Rendering API. This is useful for debugging browser automation scripts.

## Setup

```sh
npm install
```

## Usage

### Wrangler

```sh
# Headless (default)
npm run dev

# Headful (visible browser)
npm run dev:headful
```

### Vite

```sh
# Headless (default)
npm run dev:vite

# Headful (visible browser)
npm run dev:vite:headful
```

Then visit `http://localhost:8787?url=https://example.com` to trigger a screenshot.

## How it works

The `X_BROWSER_HEADFUL=true` environment variable tells Miniflare to launch Chrome without the `--headless` flag, making the browser window visible during development.

> **Note:** When using `@cloudflare/puppeteer`, two Chrome windows may appear — the initial blank page and the one created by `browser.newPage()`. This is expected behavior due to how Puppeteer handles browser contexts via CDP.
