import {launch} from '@cloudflare/puppeteer';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const browser = await launch(env.MYBROWSER);
    const page = await browser.newPage();

    await page.goto('https://demo.playwright.dev/todomvc');

    const TODO_ITEMS = [
      'buy some cheese',
      'feed the cat',
      'book a doctors appointment',
    ];

    const newTodo = page.locator('.new-todo');
    for (const item of TODO_ITEMS) {
      await newTodo.fill(item);
      await page.keyboard.press('Enter');
    }

    const img = await page.screenshot();
    await browser.close();

    return new Response(img, {
      headers: {
        'Content-Type': 'image/png',
      },
    });
  },
};
