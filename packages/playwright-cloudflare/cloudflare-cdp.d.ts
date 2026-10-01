/**
 * Type definitions for Cloudflare's custom CDP commands.
 *
 * Cloudflare's Browser Run platform exposes a non-standard `Cloudflare.*` CDP
 * domain that is not part of the upstream DevTools protocol, so it is absent
 * from Playwright's generated protocol types. This module declares the request
 * and response shapes for those commands and merges them into
 * `Protocol.CommandParameters` / `Protocol.CommandReturnValues`, which makes
 * calls such as `cdpSession.send('Cloudflare.handoff', {...})` type-check with
 * full parameter and return-type inference.
 *
 * SHARED SOURCE OF TRUTH. The interface block below is intended to be the
 * canonical definition of the `Cloudflare.*` CDP types and is vendored
 * identically into the puppeteer and playwright forks. When the
 * `cloudflare/browser-run` monorepo lands, this block should be promoted to a
 * shared package that both ports import, replacing the vendored copies. Keep
 * the two copies in sync until then. Only the `declare module` augmentation at
 * the bottom is fork-specific.
 *
 * This file lives outside the build-generated `types/` directory (which is
 * overwritten by utils/copy_types.js) so the augmentation survives rebuilds.
 *
 * @see https://jira.cfdata.org/browse/BRAPI-1194
 * @see https://jira.cfdata.org/browse/BRAPI-1218
 */

// ============================================================================
// Shared Cloudflare.* CDP types (canonical - keep in sync across forks)
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
// Fork-specific augmentation (playwright: merge into the generated Protocol
// CommandParameters / CommandReturnValues maps that CDPSession.send is keyed on)
// ============================================================================

declare module './types/protocol' {
  // Augmenting the generated Protocol namespace requires a namespace to match
  // its own declaration, so the no-namespace rule does not apply here.
  // eslint-disable-next-line @typescript-eslint/no-namespace
  export namespace Protocol {
    interface CommandParameters {
      'Cloudflare.handoff': HandoffRequest;
      'Cloudflare.handoffComplete': HandoffCompleteRequest;
      'Cloudflare.getHandoffState': GetHandoffStateRequest;
      'Cloudflare.getSessionId': GetSessionIdRequest;
      'Cloudflare.getLiveView': GetLiveViewRequest;
    }
    interface CommandReturnValues {
      'Cloudflare.handoff': HandoffResponse;
      'Cloudflare.handoffComplete': HandoffCompleteResponse;
      'Cloudflare.getHandoffState': GetHandoffStateResponse;
      'Cloudflare.getSessionId': GetSessionIdResponse;
      'Cloudflare.getLiveView': GetLiveViewResponse;
    }
  }
}

// Also augment `playwright-core`'s CDPSession so scripts that connect to
// Browser Run from Node (via `chromium.connectOverCDP('/devtools/browser')` from `playwright-core`
// directly) get typed `cdp.send('Cloudflare.*', ...)` by importing types from
// `@cloudflare/playwright`. `send` is a method signature upstream, so overload
// merging applies. Requires `playwright-core` as a resolvable peer.
declare module 'playwright-core' {
  interface CDPSession {
    send(method: 'Cloudflare.handoff', params?: HandoffRequest): Promise<HandoffResponse>;
    send(method: 'Cloudflare.handoffComplete', params?: HandoffCompleteRequest): Promise<HandoffCompleteResponse>;
    send(method: 'Cloudflare.getHandoffState', params?: GetHandoffStateRequest): Promise<GetHandoffStateResponse>;
    send(method: 'Cloudflare.getSessionId', params?: GetSessionIdRequest): Promise<GetSessionIdResponse>;
    send(method: 'Cloudflare.getLiveView', params?: GetLiveViewRequest): Promise<GetLiveViewResponse>;
  }
}
