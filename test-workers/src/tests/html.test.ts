import {fetch} from 'undici';
import {describe, it} from 'vitest';

describe('browser reads html', () => {
  it('gets html of example.com', async ({expect}) => {
    await new Promise(resolve => {
      setTimeout(resolve, 30000);
    });
    const response = await fetch(
      `https://test-workers.cloudflare-browser-rendering-085.workers.dev/html`
    );
    expect(await response.text()).toMatchSnapshot();
  });
});
