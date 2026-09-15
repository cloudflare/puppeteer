/**
 * @license
 * Copyright 2025 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

export interface BrowserRunAcquireResult {
  sessionId: string;
  webSocketDebuggerUrl?: string;
  targets?: BrowserRunTarget[];
}

export interface BrowserRunTarget {
  id: string;
  type: string;
  url: string;
  title?: string;
  description?: string;
  webSocketDebuggerUrl?: string;
  devtoolsFrontendUrl?: string;
}

export interface BrowserRunOptions {
  keepAlive?: number;
  recording?: boolean;
  lab?: boolean;
  location?: string;
  guardrails?: {
    allowedDomains?: string[];
    allowedDomainSets?: string[];
  };
  outboundByHost?: Record<string, BrowserWorker>;
  targets?: boolean;
  liveViewUrlExpiresInMs?: number;
}

export interface BrowserRunConnectOptions {
  targetId?: string;
}

export interface BrowserRunConnection {
  sessionId: string;
  webSocket: BrowserWorker;
  webSocketDebuggerUrl?: string;
  targets?: BrowserRunTarget[];
}

export interface BrowserWorker {
  fetch: typeof fetch;
  launch?: (
    options?: BrowserRunOptions,
  ) => Promise<BrowserRunConnection>;
  acquire?: (
    options?: BrowserRunOptions,
  ) => Promise<BrowserRunAcquireResult>;
  connectSession?: (
    sessionId: string,
    options?: BrowserRunConnectOptions,
  ) => Promise<BrowserRunConnection>;
}
