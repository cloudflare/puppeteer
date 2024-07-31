import {resolve} from 'path';

import {fetch} from 'undici';
import {afterAll, beforeAll, describe, it} from 'vitest';

import {runWranglerDev} from '../run-wrangler-long-lived.js';

describe('browser pdf', () => {
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

  it('gets pdf of example.com', async ({expect}) => {
    const response = await fetch(`http://${ip}:${port}/pdf`);
    expect(response.body).toMatchSnapshot();
  });
});
