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

### Configuration

Configure in `playwright.config.ts`:

```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  use: {
    // Optional: Override credentials (defaults to env vars)
    cloudflareCredentials: {
      accountId: process.env.CLOUDFLARE_ACCOUNT_ID!,
      apiToken: process.env.CLOUDFLARE_API_TOKEN!,
    },
    // Optional: Custom base URL
    browserRenderingBaseURL: 'https://api.cloudflare.com/client/v4/accounts/{accountId}/browser-rendering',
    // Optional: Custom retry options for 429 responses
    retryOptions: {
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 5000,
      jitterFactor: 0.5,
    },
  },
});
```

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `cloudflareCredentials` | `{ accountId, apiToken }` | From env vars | Cloudflare API credentials |
| `browserRenderingBaseURL` | `string` | Production API | Base URL for Browser Rendering API |
| `browserRenderingHeaders` | `Record<string, string>` | Bearer token | HTTP headers for authentication |
| `retryOptions` | `RetryOptions` | See below | Retry configuration for 429 responses |

### RetryOptions

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `maxRetries` | `number` | `3` | Maximum retry attempts |
| `baseDelay` | `number` | `1000` | Initial delay in ms |
| `maxDelay` | `number` | `5000` | Maximum delay in ms |
| `jitterFactor` | `number` | `0.5` | Randomization factor |

Retries use exponential backoff with jitter. When the server returns a `retry-after` header, the delay is the maximum of the header value and the exponential backoff.

## How It Works

1. **Session Management**: Each Playwright worker acquires its own Browser Rendering session via the API
2. **Connection**: The session is connected using `chromium.connectOverCDP()`
3. **Cleanup**: Sessions are automatically closed when the worker finishes

## Examples

See the [examples/basic](./examples/basic) directory for a complete working example.

## License

Apache-2.0
