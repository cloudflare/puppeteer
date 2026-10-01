import { test, expect } from '../server/workerFixtures';

test(`page should have a default user agent`, async ({ page }) => {
  await page.setContent(``);
  expect(await page.evaluate(() => navigator.userAgent)).toContain(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
  );
});

test(`context should be able to specify a user agent`, async ({ browser, server }) => {
  await using context = await browser.newContext({
    userAgent: 'foobar',
  });
  await using page = await context.newPage();
  await page.setContent(``);
  expect(await page.evaluate('navigator.userAgent')).toContain('foobar');
  const [request] = await Promise.all([
    page.waitForRequest('**/empty.html'),
    page.goto(server.EMPTY_PAGE),
  ]);
  expect(request.headers()['user-agent']).toBe('foobar');
});
