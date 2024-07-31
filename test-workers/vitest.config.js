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
