// @ts-expect-error internal types missing
import {_baseTest} from '@cloudflare/playwright/internal';

export const test = _baseTest.extend({});

test.skip = () => {};
globalThis.describe = test.describe;
globalThis.test = test;
globalThis.it = test;
globalThis.after = test.afterAll;
globalThis.afterEach = test.afterEach;
globalThis.before = test.beforeAll;
globalThis.beforeEach = test.beforeEach;
