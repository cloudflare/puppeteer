/**
 * Type tests for session guardrails.
 *
 * Guardrails come in two scopes and the endpoint accepts only one of them.
 * Only the session scope is supported here: `SessionGuardrails` are latched
 * onto the session when it is acquired, so they belong to `launch()` and
 * `acquire()`. The connection scope (`mode: 'readonly'`) is not exposed yet.
 *
 * See https://developers.cloudflare.com/browser-run/platform/guardrails/
 */

import { launch, acquire, endpointURLString } from '@cloudflare/playwright';
import { expectAssignable, expectNotAssignable, expectType } from 'tsd';

import type { BrowserWorker, SessionGuardrails, WorkersLaunchOptions } from '@cloudflare/playwright';

declare const binding: BrowserWorker;

const sessionPolicy: SessionGuardrails = {
  allowedDomains: ['example.com', '*.example.com', 'api.*.example.com'],
  allowedDomainSets: ['common-cdns', 'https://example.com/my-allowlist.txt'],
};
expectType<string[] | undefined>(sessionPolicy.allowedDomains);
expectType<string[] | undefined>(sessionPolicy.allowedDomainSets);

// Both properties are optional, and an empty allowlist is a valid policy
// meaning "deny all outbound traffic".
expectAssignable<SessionGuardrails>({});
expectAssignable<SessionGuardrails>({ allowedDomains: [] });

// launch and acquire take the session scope.
expectAssignable<WorkersLaunchOptions>({ guardrails: sessionPolicy });
expectAssignable<WorkersLaunchOptions>({ guardrails: { allowedDomains: ['*.example.com'] }, keep_alive: 30000 });
await launch(binding, { guardrails: { allowedDomains: ['*.example.com'] } });
await acquire(binding, { guardrails: { allowedDomainSets: ['common-cdns'] } });

// `mode` belongs to a connection, so it is not accepted at acquire time.
expectNotAssignable<SessionGuardrails>({ mode: 'readonly' });
expectNotAssignable<WorkersLaunchOptions>({ guardrails: { mode: 'readonly' } });

// Unknown guardrail properties are rejected.
expectNotAssignable<WorkersLaunchOptions>({ guardrails: { allowedHosts: [] } });

// A policy is sent in the acquire request body, so an endpoint URL cannot carry one.
// @ts-expect-error
endpointURLString(binding, { guardrails: sessionPolicy });

// Guardrails stay optional: existing calls keep compiling.
await launch(binding);
await acquire(binding);
expectAssignable<WorkersLaunchOptions>({ keep_alive: 30000 });
