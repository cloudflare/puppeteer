import {fetch} from 'undici';
import {describe, it} from 'vitest';

describe('browser does basic manipulations', () => {
  it('gets the title of google developers website', async ({expect}) => {
    await new Promise(resolve => {
      setTimeout(resolve, 30000);
    });
    const response = await fetch(
      `https://test-workers.cloudflare-browser-rendering-085.workers.dev/basic-interactions`
    );
    expect(await response.text()).toMatchSnapshot();
  });
});
