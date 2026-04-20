import {_baseTest} from '@cloudflare/playwright/internal';

export const test = _baseTest.extend({});

// some skipped puppeteer tests have name collisions, and playwright test framework
// does not allow tests with the same name
test.skip = () => {};
(globalThis as any).describe = test.describe;
(globalThis as any).test = test;
(globalThis as any).it = test;
(globalThis as any).after = test.afterAll;
(globalThis as any).afterEach = test.afterEach;
(globalThis as any).before = test.beforeAll;
(globalThis as any).beforeEach = test.beforeEach;
