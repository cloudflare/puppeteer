/**
 * Type test: the Browser Run binding type from @cloudflare/workers-types must
 * be accepted where a `BrowserWorker` is expected, so `launch(env.BROWSER)`
 * compiles without a cast. Its options differ from ours (for example,
 * `outboundByHost` values are `Fetcher`s), which fails under
 * `strictFunctionTypes` if `BrowserWorker` declares function-typed properties.
 */

import { acquire, connect, launch, limits, sessions } from '@cloudflare/playwright';
import type { AcquireResponse, BrowserWorker, SessionGuardrails, WorkersLaunchOptions } from '@cloudflare/playwright';
import { expectAssignable, expectNotAssignable, expectType } from 'tsd';

declare const env: { BROWSER: BrowserRun };

expectAssignable<BrowserWorker>(env.BROWSER);
await launch(env.BROWSER);
await connect(env.BROWSER, 'SESSION_ID');
await acquire(env.BROWSER);

// Bindings with only `fetch`, such as service bindings and test doubles.
declare const serviceBinding: Fetcher;
expectAssignable<BrowserWorker>(serviceBinding);
expectAssignable<BrowserWorker>({ fetch: async () => new Response('ok') });
expectNotAssignable<BrowserWorker>({});

// The exported data types are the Browser Run types of the Workers runtime.
expectType<BrowserRunAcquireGuardrails>({} as SessionGuardrails);
expectType<BrowserRunAcquireResult>({} as AcquireResponse);
expectType<BrowserRunSession[]>(await sessions(env.BROWSER));
expectType<BrowserRunLimits>(await limits(env.BROWSER));
expectType<BrowserRunAcquireOptions['outboundByHost']>(
  {} as WorkersLaunchOptions['outboundByHost'],
);
