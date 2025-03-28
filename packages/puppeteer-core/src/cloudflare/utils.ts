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
