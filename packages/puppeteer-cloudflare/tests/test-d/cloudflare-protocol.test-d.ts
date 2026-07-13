/**
 * Type test for Cloudflare.\* CDP commands.
 *
 * Mirrors the "Example: structured handoff" from
 * https://developers.cloudflare.com/browser-run/features/human-in-the-loop/#example-structured-handoff
 *
 * This script validates that the new Cloudflare.\* CDP type augmentations allow
 * `cdp.send('Cloudflare.*', ...)` calls to type-check without manual interface
 * definitions or `as` casts.
 */

import type {
  CDPSession,
  HandoffResponse,
  HandoffCompleteResponse,
  GetLiveViewRequest,
  GetLiveViewResponse,
  GetSessionIdResponse,
  GetHandoffStateResponse,
} from '@cloudflare/puppeteer';
import {expectType} from 'tsd';

declare const cdp: CDPSession;

// Cloudflare.getLiveView — should infer GetLiveViewResponse
const liveViewParams: GetLiveViewRequest = {
  mode: 'tab',
  expiresInMs: 300000,
};
expectType<GetLiveViewRequest>(liveViewParams);
expectType<number | undefined>(liveViewParams.expiresInMs);
const liveViewResult = await cdp.send('Cloudflare.getLiveView', liveViewParams);
expectType<GetLiveViewResponse>(liveViewResult);
expectType<string>(liveViewResult.devtoolsFrontendUrl);
expectType<string>(liveViewResult.webSocketDebuggerUrl);
expectType<string>(liveViewResult.id);

// Cloudflare.handoff — should infer HandoffResponse
const handoffResult = await cdp.send('Cloudflare.handoff', {
  instructions: 'Please log in with your GitHub credentials',
  timeout: 600000,
});
expectType<HandoffResponse>(handoffResult);
expectType<string>(handoffResult.handoffId);
expectType<string>(handoffResult.targetId);

// Cloudflare.handoffComplete — should infer HandoffCompleteResponse
const completeResult = await cdp.send('Cloudflare.handoffComplete', {
  success: true,
  reason: 'User completed login',
});
expectType<HandoffCompleteResponse>(completeResult);
expectType<boolean>(completeResult.success);
expectType<string>(completeResult.targetId);

// Cloudflare.getHandoffState — should infer GetHandoffStateResponse
const stateResult = await cdp.send('Cloudflare.getHandoffState', {});
expectType<GetHandoffStateResponse>(stateResult);
expectType<boolean>(stateResult.active);

// Cloudflare.getSessionId — should infer GetSessionIdResponse
const sessionResult = await cdp.send('Cloudflare.getSessionId', {});
expectType<GetSessionIdResponse>(sessionResult);
expectType<string>(sessionResult.sessionId);

// No params variant — should also work
const handoffNoParams = await cdp.send('Cloudflare.handoff');
expectType<HandoffResponse>(handoffNoParams);

const liveViewNoParams = await cdp.send('Cloudflare.getLiveView');
expectType<GetLiveViewResponse>(liveViewNoParams);
