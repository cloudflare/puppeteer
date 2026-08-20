/**
 * Type tests for session guardrails options.
 *
 * Guardrails restrict the outbound traffic of a session and are latched onto it
 * as it is acquired, so they belong to the calls that acquire one: `launch`,
 * `acquire`, and `connect` when it acquires and connects (no session id).
 *
 * See https://developers.cloudflare.com/browser-run/platform/guardrails/
 */

import type {
  BrowserWorker,
  SessionGuardrails,
  WorkersLaunchOptions,
} from '@cloudflare/puppeteer';
import {connect, launch, acquire} from '@cloudflare/puppeteer';
import {expectAssignable, expectNotAssignable, expectType} from 'tsd';

declare const endpoint: BrowserWorker;

const policy: SessionGuardrails = {
  allowedDomains: ['example.com', '*.example.com', 'api.*.example.com'],
  allowedDomainSets: ['common-cdns', 'https://example.com/my-allowlist.txt'],
};
expectType<string[] | undefined>(policy.allowedDomains);
expectType<string[] | undefined>(policy.allowedDomainSets);

// Both properties are optional, and an empty allowlist is a valid policy
// meaning "deny all outbound traffic".
expectAssignable<SessionGuardrails>({});
expectAssignable<SessionGuardrails>({allowedDomains: []});

// Guardrails sit alongside the other launch options.
expectAssignable<WorkersLaunchOptions>({guardrails: policy});
expectAssignable<WorkersLaunchOptions>({
  guardrails: {allowedDomains: ['*.example.com']},
  keep_alive: 30000,
  location: 'US',
});

await launch(endpoint, {guardrails: {allowedDomains: ['*.example.com']}});
await acquire(endpoint, {guardrails: {allowedDomainSets: ['common-cdns']}});

// connect acquires the session itself when given a browser, so it takes them too.
await connect(endpoint, undefined, {
  browser: 'kitesurf',
  guardrails: {allowedDomains: ['*.example.com']},
});

// The connection scope is not part of the API.
expectNotAssignable<SessionGuardrails>({mode: 'readonly'});
expectNotAssignable<WorkersLaunchOptions>({guardrails: {mode: 'readonly'}});

// Unknown guardrail properties are rejected.
expectNotAssignable<WorkersLaunchOptions>({guardrails: {allowedHosts: []}});

// Guardrails stay optional: existing calls keep compiling.
await launch(endpoint);
await connect(endpoint, 'SESSION_ID');
