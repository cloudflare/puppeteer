/**
 * @license
 * Copyright 2025 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Type definitions for Cloudflare's custom CDP commands.
 *
 * Cloudflare's Browser Run platform exposes a non-standard `Cloudflare.*` CDP
 * domain that is not part of the upstream DevTools protocol, so it is absent
 * from the `devtools-protocol` package. This module declares the request and
 * response shapes for those commands and merges them into
 * `ProtocolMapping.Commands`, which makes calls such as
 * `session.send('Cloudflare.handoff', {...})` type-check with full parameter
 * and return-type inference.
 *
 * SHARED SOURCE OF TRUTH. The interface block below is intended to be the
 * canonical definition of the `Cloudflare.*` CDP types and is vendored
 * identically into the puppeteer and playwright forks. When the
 * `cloudflare/browser-run` monorepo lands, this block should be promoted to a
 * shared package that both ports import, replacing the vendored copies. Keep
 * the two copies in sync until then. Only the `declare module` augmentation at
 * the bottom is fork-specific.
 *
 * @see https://jira.cfdata.org/browse/BRAPI-1194
 * @see https://jira.cfdata.org/browse/BRAPI-1218
 */

// ============================================================================
// Shared Cloudflare.* CDP types (canonical — keep in sync across forks)
// ============================================================================

/**
 * Live view mode options.
 *
 * @public
 */
export type LiveViewMode = 'devtools' | 'tab' | 'full';

// ---------------- Cloudflare.handoff ----------------

/**
 * @public
 */
export interface HandoffRequest {
  /**
   * Target page ID requiring intervention.
   */
  targetId?: string;
  /**
   * Human-readable instructions (max 4096 chars).
   */
  instructions?: string;
  /**
   * Timeout in milliseconds (max 30 minutes).
   */
  timeout?: number;
}

/**
 * @public
 */
export interface HandoffResponse {
  /**
   * The target page ID.
   */
  targetId: string;
  /**
   * Unique identifier for this handoff.
   */
  handoffId: string;
}

// ---------------- Cloudflare.handoffComplete ----------------

/**
 * @public
 */
export interface HandoffCompleteRequest {
  /**
   * Target page ID.
   */
  targetId?: string;
  /**
   * Whether intervention was successful. Defaults to true.
   */
  success?: boolean;
  /**
   * Reason for the result (max 1024 chars).
   */
  reason?: string;
}

/**
 * @public
 */
export interface HandoffCompleteResponse {
  /**
   * Target page ID.
   */
  targetId: string;
  /**
   * Unique identifier for the handoff.
   */
  handoffId?: string;
  /**
   * Original instructions for the handoff.
   */
  instructions?: string;
  /**
   * Whether intervention was successful.
   */
  success: boolean;
  /**
   * Reason for the result.
   */
  reason?: string;
}

// ---------------- Cloudflare.getHandoffState ----------------

/**
 * @public
 */
export interface GetHandoffStateRequest {
  /**
   * Target page ID.
   */
  targetId?: string;
}

/**
 * @public
 */
export interface GetHandoffStateResponse {
  /**
   * Whether a handoff is active.
   */
  active: boolean;
  /**
   * Unique identifier for the handoff.
   */
  handoffId?: string;
  /**
   * Active handoff instructions.
   */
  instructions?: string;
  /**
   * Active handoff timeout in milliseconds.
   */
  timeout?: number;
  /**
   * Elapsed time since handoff started in milliseconds.
   */
  durationMs?: number;
}

// ---------------- Cloudflare.getSessionId ----------------

/**
 * @public
 */
export type GetSessionIdRequest = Record<string, never>;

/**
 * @public
 */
export interface GetSessionIdResponse {
  sessionId: string;
}

// ---------------- Cloudflare.getLiveView ----------------

/**
 * @public
 */
export interface GetLiveViewRequest {
  /**
   * Target ID to get live view for. Optional - auto-resolved if omitted.
   */
  targetId?: string;
  /**
   * Live view mode: devtools, tab, or full. Defaults to "devtools".
   */
  mode?: LiveViewMode;
  /**
   * Expiration time in milliseconds. Defaults to 5 minutes.
   */
  expiresInMs?: number;
}

/**
 * @public
 */
export interface GetLiveViewResponse {
  /**
   * WebSocket URL for the live view.
   */
  webSocketDebuggerUrl: string;
  /**
   * DevTools frontend URL for the live view.
   */
  devtoolsFrontendUrl: string;
  /**
   * The target ID.
   */
  id: string;
  /**
   * Live view options.
   */
  options: Record<string, unknown>;
}

// ============================================================================
// Fork-specific augmentation (puppeteer: merge into ProtocolMapping.Commands)
// ============================================================================

declare module 'devtools-protocol/types/protocol-mapping.js' {
  // Augmenting devtools-protocol's ProtocolMapping requires a namespace to
  // match its own declaration, so the no-namespace rule does not apply here.
  // eslint-disable-next-line @typescript-eslint/no-namespace
  export namespace ProtocolMapping {
    interface Commands {
      'Cloudflare.handoff': {
        paramsType: [HandoffRequest?];
        returnType: HandoffResponse;
      };
      'Cloudflare.handoffComplete': {
        paramsType: [HandoffCompleteRequest?];
        returnType: HandoffCompleteResponse;
      };
      'Cloudflare.getHandoffState': {
        paramsType: [GetHandoffStateRequest?];
        returnType: GetHandoffStateResponse;
      };
      'Cloudflare.getSessionId': {
        paramsType: [GetSessionIdRequest?];
        returnType: GetSessionIdResponse;
      };
      'Cloudflare.getLiveView': {
        paramsType: [GetLiveViewRequest?];
        returnType: GetLiveViewResponse;
      };
    }
  }
}
