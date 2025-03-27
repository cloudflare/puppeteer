import {Browser} from '@cloudflare/puppeteer';

export const test = async (browser: Browser): Promise<Response> => {
  const page = await browser.newPage();

  await page.goto('https://example.com/');
  const img = (await page.screenshot()) as Buffer;

  return new Response(img, {
    headers: {
      'content-type': 'image/jpeg',
    },
  });
};
