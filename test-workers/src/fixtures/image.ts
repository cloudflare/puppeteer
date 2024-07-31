import {Browser} from 'puppeteer-core';

export const test = async (browser: Browser): Promise<Response> => {
  const page = await browser.newPage();

  await page.goto('https://example.com/');
  //   const dom = await page.content();
  //   const html = await response!.text();
  //   const pdf = await page.pdf();
  const img = (await page.screenshot()) as Buffer;

  return new Response(img, {
    headers: {
      'content-type': 'image/jpeg',
    },
  });
};
