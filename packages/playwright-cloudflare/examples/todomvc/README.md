# Playwright Cloudflare TodoMVC Example

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/cloudflare/playwright/tree/main/packages/playwright-cloudflare/examples/todomvc)

This example demonstrates how to run Playwright tests in a Cloudflare Worker using the TodoMVC application.

## Features

- Screenshots of TodoMVC app with custom todo items
- Optional trace generation
- Runs completely in Cloudflare Workers

## Setup

1. Install dependencies:
```bash
npm ci
```

2. Build the project:
```bash
npm run build
```

3. Deploy to Cloudflare Workers:
```bash
npm run deploy
```

## Usage

Once deployed, you can interact with the Worker using these URL patterns:

### Capture Screenshot
```
https://<your-worker>.workers.dev
```
Returns a screenshot of the TodoMVC app with default todo items.

### Generate Trace

To generate a trace and open it in [Playwright Trace Viewer](https://trace.playwright.dev/), use the following URL:

```
https://trace.playwright.dev/?trace=https://<your-worker>.workers.dev
```

To download the trace, use the following URL:
```
https://<your-worker>.workers.dev?trace
```
