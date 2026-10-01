/**
 * @license
 * Copyright 2025 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

// Browser Run types come from the Workers runtime types, which every Worker
// project loads, either from @cloudflare/workers-types or from `wrangler types`.
// Refer to their global names instead of copying them, so that they cannot
// drift from the binding. They require @cloudflare/workers-types 5.20260917.1 or
// later, or the types that `wrangler types` generates with Wrangler 4.134.0 or
// later.

/**
 * A Browser Run binding, or any other binding with a Browser Run compatible
 * `fetch`, such as a service binding.
 *
 * @remarks
 * Only `fetch` is required. The Browser Run RPC methods are used when the
 * binding has them.
 *
 * @public
 */
export interface BrowserWorker
  extends Partial<Pick<BrowserRun, 'launch' | 'acquire' | 'connectSession'>> {
  fetch: typeof fetch;
}
