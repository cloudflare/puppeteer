/**
 * @license
 * Copyright 2025 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Module augmentation for Cloudflare's custom CDP commands.
 *
 * This file must be separate from the bundled types.d.ts because API Extractor
 * strips `declare module` augmentations during bundling. TypeScript will pick
 * up this file alongside types.d.ts when `@cloudflare/puppeteer` is imported,
 * making `session.send('Cloudflare.*', ...)` type-check correctly.
 */

import type {
  HandoffRequest,
  HandoffResponse,
  HandoffCompleteRequest,
  HandoffCompleteResponse,
  GetHandoffStateRequest,
  GetHandoffStateResponse,
  GetSessionIdRequest,
  GetSessionIdResponse,
  GetLiveViewRequest,
  GetLiveViewResponse,
} from './lib/types.js';

declare module 'devtools-protocol/types/protocol-mapping.js' {
  namespace ProtocolMapping {
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
