import { test, expect } from '@cloudflare/browser-playwright-test';

test('has title', async ({ page }) => {
  await page.goto('https://example.com');
  await expect(page).toHaveTitle('Example Domain');
});
