/**
 * @license
 * Copyright 2025 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

// Build-only declarations, not emitted. The published declarations refer to the
// Browser Run types of the Workers runtime by their global names, which every
// Worker project gets from @cloudflare/workers-types or `wrangler types`. This
// package compiles with the DOM library, which conflicts with the global form of
// the Workers types, so define the same global names from their module form.
import type * as Workers from '@cloudflare/workers-types/index.js';

declare global {
  type BrowserRun = Workers.BrowserRun;
  type BrowserRunAcquireGuardrails = Workers.BrowserRunAcquireGuardrails;
  type BrowserRunAcquireOptions = Workers.BrowserRunAcquireOptions;
  type BrowserRunAcquireResult = Workers.BrowserRunAcquireResult;
  type BrowserRunConnection = Workers.BrowserRunConnection;
  type BrowserRunLimits = Workers.BrowserRunLimits;
  type BrowserRunSession = Workers.BrowserRunSession;
}
