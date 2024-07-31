// import {defineWorkersConfig} from '@cloudflare/vitest-pool-workers/config';

// export default defineWorkersConfig({
//   test: {
//     poolOptions: {
//       workers: {
//         singleWorker: true,
//         wrangler: {configPath: './wrangler.toml', environment: 'remote'},
//       },
//     },
//   },
// });

import {defineProject} from 'vitest/config';

export default defineProject({
  test: {
    hookTimeout: 100000,
    testTimeout: 100000,
    maxConcurrency: 0,
    poolOptions: {
      threads: {
        singleThread: true,
      },
    },
  },
});
