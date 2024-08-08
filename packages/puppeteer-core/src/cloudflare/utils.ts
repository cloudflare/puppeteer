export const DEFAULT_VIEWPORT = Object.freeze({width: 800, height: 600});

import {CDPBrowser} from '../common/Browser.js';
import {BrowserConnectOptions} from '../common/BrowserConnector.js';
import {Connection} from '../common/Connection.js';
import {ConnectionTransport} from '../common/ConnectionTransport.js';
import {ConnectOptions} from '../common/Puppeteer.js';
/**
 * Users should never call this directly; it's called when calling
 * `puppeteer.connect` with `protocol: 'cdp'`.
 *
 *
 */
export async function connectToCDPBrowser(
  connectionTransport: ConnectionTransport,
  options: BrowserConnectOptions & ConnectOptions & {sessionId?: string}
): Promise<CDPBrowser> {
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
  const browser = await CDPBrowser._create(
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
