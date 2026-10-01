/**
 * Type test for launch() overloads.
 *
 * `launch()` returns a SessionlessBrowser when `browser: 'kitesurf'` is passed, since
 * no session is acquired in that case. Every other overload keeps `sessionId(): string`.
 */

import { launch } from '@cloudflare/playwright';
import { expectType } from 'tsd';

import type { Browser, BrowserWorker, SessionlessBrowser } from '@cloudflare/playwright';

declare const binding: BrowserWorker;

// default launch - session backed, sessionId is always a string
expectType<Browser>(await launch(binding));
expectType<string>((await launch(binding)).sessionId());

// launch with regular options - still session backed
expectType<Browser>(await launch(binding, { keep_alive: 30000 }));
expectType<string>((await launch(binding, { keep_alive: 30000 })).sessionId());

// kitesurf - no session, so no session id
expectType<SessionlessBrowser>(await launch(binding, { browser: 'kitesurf' }));
expectType<undefined>((await launch(binding, { browser: 'kitesurf' })).sessionId());

// kitesurf combined with other options still resolves to SessionlessBrowser
expectType<SessionlessBrowser>(await launch(binding, { browser: 'kitesurf', keep_alive: 30000 }));

// string endpoints keep working
expectType<Browser>(await launch('http://fake.host/v1/devtools/browser?browser_binding=BROWSER'));
