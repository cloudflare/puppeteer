import fs from 'fs';

import { launch } from '@cloudflare/playwright';
import { expect } from '@cloudflare/playwright/test';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'https://trace.playwright.dev',
  'Access-Control-Allow-Methods': 'GET',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export default {
  async fetch(request: Request, env: Env) {
    const url = new URL(request.url);
    
    if (url.pathname !== '/') {
      return new Response(null, { status: 404 });
    }

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }
    
    const trace = url.searchParams.has('trace') || request.headers.get('referer') === 'https://trace.playwright.dev/';
    const todos = url.searchParams.getAll('todo');    
    
    const browser = await launch(env.MYBROWSER);
    const page = await browser.newPage();
    
    if (trace)
      await page.context().tracing.start({ screenshots: true, snapshots: true });

    await page.goto('https://demo.playwright.dev/todomvc');

    const TODO_ITEMS = todos.length > 0 ? todos : [
      'buy some cheese',
      'feed the cat',
      'book a doctors appointment'
    ];

    const newTodo = page.getByPlaceholder('What needs to be done?');
    for (const item of TODO_ITEMS) {
      await newTodo.fill(item);
      await newTodo.press('Enter');
    }

    await expect(page.getByTestId('todo-title')).toHaveCount(TODO_ITEMS.length);

    await Promise.all(TODO_ITEMS.map(
        (value, index) => expect(page.getByTestId('todo-title').nth(index)).toHaveText(value)
    ));

    if (trace) {
      // we must write the trace to /tmp as it is the only directory 
      // that is writable in the worker
      await page.context().tracing.stop({ path: '/tmp/trace.zip' });
      await browser.close();
      const file = await fs.promises.readFile('/tmp/trace.zip');

      return new Response(new Uint8Array(file), {
        status: 200,
        headers: {
          'Content-Type': 'application/zip',
          ...CORS_HEADERS,
        },
      });
    } else {
      const img = await page.screenshot();
      await browser.close();

      return new Response(new Uint8Array(img), {
        headers: {
          'Content-Type': 'image/png',
        },
      });
    }
  },
};
