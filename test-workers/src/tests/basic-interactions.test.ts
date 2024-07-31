import {resolve} from 'path';

import {fetch} from 'undici';
import {afterAll, beforeAll, describe, it} from 'vitest';

import {runWranglerDev} from '../run-wrangler-long-lived.js';

describe('browser does basic manipulations', () => {
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

  it('gets the title of google developers website', async ({expect}) => {
    const response = await fetch(`http://${ip}:${port}/basic-interactions`);
    console.log(response);
    expect(await response.text()).toMatchSnapshot();
  });
});
