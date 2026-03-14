# @cloudflare/browser-playwright-test

Playwright Test fixtures for [Cloudflare Browser Rendering](https://developers.cloudflare.com/browser-rendering/).

## Installation

```bash
npm install --save-dev @cloudflare/browser-playwright-test @playwright/test
```

## Usage

### Basic Setup

Create your test file:

```typescript
// tests/example.spec.ts
import { test, expect } from '@cloudflare/browser-playwright-test';

test('example test', async ({ page }) => {
  await page.goto('https://example.com');
  await expect(page).toHaveTitle('Example Domain');
});
```

### Environment Variables

Set the required environment variables:

```bash
export CLOUDFLARE_ACCOUNT_ID="your-account-id"
export CLOUDFLARE_API_TOKEN="your-api-token"
```

To create an API token, go to [Cloudflare API Tokens](https://dash.cloudflare.com/profile/api-tokens) and create a token with **Browser Rendering Edit** permissions.

### Configuration

Configure in `playwright.config.ts`:

```typescript
import { defineConfig } from '@cloudflare/browser-playwright-test';

export default defineConfig({
  testDir: './tests',
  use: {
    browserRendering: {
      sessions: {
        keepAlive: 60000,  // Keep-alive timeout in ms
        lab: false,        // Use lab environment
        retry: {           // Retry options for 429 responses
          maxRetries: 3,
          baseDelay: 1000,
          maxDelay: 5000,
          jitterFactor: 0.5,
        },
      },
    },
  },
});
```

## Options

All options are nested under `browserRendering`:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `sessions` | `SessionsOptions` | See below | Session options |
| `annotations` | `'on' \| 'off'` | `'on'` | Add annotations to test results |

### SessionsOptions

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `keepAlive` | `number` | `60000` | Keep-alive timeout in ms |
| `lab` | `boolean` | `false` | Use lab environment |
| `retry` | `RetryOptions` | See below | Retry configuration for 429 responses |

### RetryOptions

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `maxRetries` | `number` | `3` | Maximum retry attempts |
| `baseDelay` | `number` | `1000` | Initial delay in ms |
| `maxDelay` | `number` | `5000` | Maximum delay in ms |
| `jitterFactor` | `number` | `0.5` | Randomization factor |

Retries use exponential backoff with jitter. When the server returns a `retry-after` header, the delay is the maximum of the header value and the exponential backoff.

## How It Works

When `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN` environment variables are set:

1. **Session Management**: Each Playwright worker acquires its own Browser Rendering session via the API
2. **Connection**: The session is connected using `playwright.chromium.connectOverCDP()`
3. **Cleanup**: Sessions are automatically closed when the worker finishes

When the environment variables are not set, tests run locally using Playwright's default browser launch.

## Examples

See the [examples/basic](./examples/basic) and [examples/todomvc](./examples/todomvc) directories for complete working examples.

## License

Apache-2.0
