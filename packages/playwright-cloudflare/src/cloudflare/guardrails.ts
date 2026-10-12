import type { SessionGuardrails } from '../..';

// A websocket upgrade has no body, so a policy travels as this header instead.
export const GUARDRAILS_HEADER = 'cf-brapi-guardrails';

export function encodeGuardrailsHeader(policy: SessionGuardrails): string {
  const bytes = new TextEncoder().encode(JSON.stringify(policy));
  // Built one byte at a time rather than `String.fromCharCode(...bytes)`: the spread passes one
  // argument per byte, which blows the engine's argument limit once a policy outgrows the
  // current caps. Core enforces those caps and may raise them.
  let binary = '';
  for (const byte of bytes)
    binary += String.fromCharCode(byte);

  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
}
