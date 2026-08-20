/**
 * @license
 * Copyright 2025 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
export const DEFAULT_VIEWPORT = Object.freeze({width: 800, height: 600});

import {CdpBrowser} from '../cdp/Browser.js';
import {Connection} from '../cdp/Connection.js';
import type {ConnectionTransport} from '../common/ConnectionTransport.js';
import type {
  BrowserConnectOptions,
  ConnectOptions,
} from '../common/ConnectOptions.js';
/**
 * Users should never call this directly; it's called when calling
 * `puppeteer.connect` with `protocol: 'cdp'`.
 *
 *
 */
export async function connectToCDPBrowser(
  connectionTransport: ConnectionTransport,
  options: BrowserConnectOptions & ConnectOptions & {sessionId?: string}
): Promise<CdpBrowser> {
  const {
    ignoreHTTPSErrors = false,
    defaultViewport = DEFAULT_VIEWPORT,
    targetFilter,
    _isPageTarget: isPageTarget,
    slowMo = 0,
    protocolTimeout,
    sessionId = 'unknown',
  } = options;

  const connection = new Connection(
    '',
    connectionTransport,
    slowMo,
    protocolTimeout
  );

  const version = await connection.send('Browser.getVersion');
  const product = version.product.toLowerCase().includes('firefox')
    ? 'firefox'
    : 'chrome';

  const {browserContextIds} = await connection.send(
    'Target.getBrowserContexts'
  );
  const browser = await CdpBrowser._create(
    product || 'chrome',
    connection,
    browserContextIds,
    ignoreHTTPSErrors,
    defaultViewport,
    undefined,
    () => {
      return connection.send('Browser.close').catch(console.log);
    },
    targetFilter,
    isPageTarget,
    true,
    sessionId
  );
  return browser;
}

/**
 * @public
 */
export type Browsers = 'kitesurf';

/**
 * Guardrails that restrict the outbound traffic of a browser session.
 *
 * @remarks
 * Set when the session is acquired and latched for its lifetime: they cannot be
 * changed or removed by later connections. An empty `allowedDomains` denies all
 * outbound traffic, and an invalid policy fails closed rather than allowing
 * unrestricted access.
 *
 * @public
 */
export interface SessionGuardrails {
  /**
   * Hostname patterns the browser may access, max 50.
   *
   * @remarks
   * Each entry is a bare hostname (no scheme, port or path) and may contain a
   * single `*` wildcard. Prefer `*.example.com` (subdomain wildcard) over
   * `*example.com` (prefix wildcard), which also matches lookalikes such as
   * `evilexample.com`.
   */
  allowedDomains?: string[];
  /**
   * Preset names or HTTPS URLs of newline-separated hostname lists, max 4.
   *
   * @remarks
   * The available preset is `common-cdns`.
   */
  allowedDomainSets?: string[];
}

/**
 * Guardrails header, base64url-encoded JSON. Carries the policy on the websocket
 * upgrade, which has no body to put it in. Whether the endpoint accepts it is the
 * endpoint's business.
 *
 * @internal
 */
export const GUARDRAILS_HEADER = 'cf-brapi-guardrails';

/**
 * base64url-encodes a guardrails policy for {@link GUARDRAILS_HEADER}.
 *
 * @remarks
 * The bytes are accumulated one at a time rather than spread into
 * `String.fromCharCode(...bytes)`, which passes one argument per byte and blows
 * the engine's argument limit once a policy grows.
 *
 * @internal
 */
export function encodeGuardrailsHeader(policy: SessionGuardrails): string {
  const bytes = new TextEncoder().encode(JSON.stringify(policy));
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary)
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replace(/=+$/, '');
}

/**
 * @public
 */
export type Locations =
  | 'AF'
  | 'AL'
  | 'DZ'
  | 'AD'
  | 'AO'
  | 'AG'
  | 'AR'
  | 'AM'
  | 'AU'
  | 'AT'
  | 'AZ'
  | 'BH'
  | 'BD'
  | 'BB'
  | 'BY'
  | 'BE'
  | 'BZ'
  | 'BJ'
  | 'BM'
  | 'BT'
  | 'BO'
  | 'BA'
  | 'BW'
  | 'BR'
  | 'BN'
  | 'BG'
  | 'BF'
  | 'BI'
  | 'KH'
  | 'CM'
  | 'CA'
  | 'CV'
  | 'KY'
  | 'CF'
  | 'TD'
  | 'CL'
  | 'CN'
  | 'CO'
  | 'KM'
  | 'CG'
  | 'CR'
  | 'CI'
  | 'HR'
  | 'CU'
  | 'CY'
  | 'CZ'
  | 'CD'
  | 'DK'
  | 'DJ'
  | 'DM'
  | 'DO'
  | 'EC'
  | 'EG'
  | 'SV'
  | 'GQ'
  | 'ER'
  | 'EE'
  | 'SZ'
  | 'ET'
  | 'FJ'
  | 'FI'
  | 'FR'
  | 'GA'
  | 'GE'
  | 'DE'
  | 'GH'
  | 'GR'
  | 'GL'
  | 'GD'
  | 'GT'
  | 'GN'
  | 'GW'
  | 'GY'
  | 'HT'
  | 'HN'
  | 'HU'
  | 'IS'
  | 'IN'
  | 'ID'
  | 'IR'
  | 'IQ'
  | 'IE'
  | 'IL'
  | 'IT'
  | 'JM'
  | 'JP'
  | 'JO'
  | 'KZ'
  | 'KE'
  | 'KI'
  | 'KW'
  | 'KG'
  | 'LA'
  | 'LV'
  | 'LB'
  | 'LS'
  | 'LR'
  | 'LY'
  | 'LI'
  | 'LT'
  | 'LU'
  | 'MO'
  | 'MG'
  | 'MW'
  | 'MY'
  | 'MV'
  | 'ML'
  | 'MR'
  | 'MU'
  | 'MX'
  | 'FM'
  | 'MD'
  | 'MC'
  | 'MN'
  | 'MS'
  | 'MA'
  | 'MZ'
  | 'MM'
  | 'NA'
  | 'NR'
  | 'NP'
  | 'NL'
  | 'NZ'
  | 'NI'
  | 'NE'
  | 'NG'
  | 'KP'
  | 'MK'
  | 'NO'
  | 'OM'
  | 'PK'
  | 'PS'
  | 'PA'
  | 'PG'
  | 'PY'
  | 'PE'
  | 'PH'
  | 'PL'
  | 'PT'
  | 'QA'
  | 'RO'
  | 'RU'
  | 'RW'
  | 'SH'
  | 'KN'
  | 'LC'
  | 'VC'
  | 'WS'
  | 'SM'
  | 'ST'
  | 'SA'
  | 'SN'
  | 'RS'
  | 'SC'
  | 'SL'
  | 'SK'
  | 'SI'
  | 'SB'
  | 'SO'
  | 'ZA'
  | 'KR'
  | 'SS'
  | 'ES'
  | 'LK'
  | 'SD'
  | 'SR'
  | 'SE'
  | 'CH'
  | 'SY'
  | 'TW'
  | 'TJ'
  | 'TZ'
  | 'TH'
  | 'BS'
  | 'GM'
  | 'TL'
  | 'TG'
  | 'TO'
  | 'TT'
  | 'TN'
  | 'TR'
  | 'TM'
  | 'UG'
  | 'UA'
  | 'AE'
  | 'GB'
  | 'US'
  | 'UY'
  | 'UZ'
  | 'VU'
  | 'VE'
  | 'VN'
  | 'YE'
  | 'ZM'
  | 'ZW';
