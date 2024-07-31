import {resolve} from 'path';

import {fetch} from 'undici';
import {afterAll, beforeAll, describe, it} from 'vitest';

import {runWranglerDev} from '../run-wrangler-long-lived.js';

describe('browser reads html', () => {
  let ip: string,
    port: number,
    stop: (() => Promise<unknown>) | undefined,
    getOutput: () => string;

  // @ts-expect-error not sure why this is not working
  beforeAll(async () => {
    return ({ip, port, stop, getOutput} = await runWranglerDev(
      resolve(__dirname, '../..'),
      ['--remote']
    ));
  });

  afterAll(async () => {
    await stop?.();
    console.log(getOutput());
  });

  it('gets html of example.com', async ({expect}) => {
    const response = await fetch(`http://${ip}:${port}/html`);
    expect(response.body).toMatchSnapshot();
  });
});
