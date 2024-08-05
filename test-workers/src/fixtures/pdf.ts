import {Browser} from '@cloudflare/puppeteer';

export const test = async (browser: Browser): Promise<Response> => {
  const page = await browser.newPage();

  await page.goto('https://example.com/');
  //   const dom = await page.content();
  //   const html = await response!.text();
  const pdf = await page.pdf();

  return new Response(pdf, {
    headers: {
      'content-type': 'application/pdf',
    },
  });
};
