/**
 * Type test: the Browser Run binding type from @cloudflare/workers-types must
 * be accepted where a `BrowserWorker` is expected, so `launch(env.BROWSER)`
 * compiles without a cast. Its options differ from ours (for example,
 * `outboundByHost` values are `Fetcher`s), which fails under
 * `strictFunctionTypes` if `BrowserWorker` declares function-typed properties.
 */

import { acquire, connect, launch } from '@cloudflare/playwright';
import type { BrowserWorker } from '@cloudflare/playwright';
import { expectAssignable } from 'tsd';

declare const env: { BROWSER: BrowserRun };

expectAssignable<BrowserWorker>(env.BROWSER);
await launch(env.BROWSER);
await connect(env.BROWSER, 'SESSION_ID');
await acquire(env.BROWSER);
