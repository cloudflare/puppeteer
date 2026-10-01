import puppeteer, {
  connect,
  type ConnectOptions,
  type ProtocolType,
} from '@cloudflare/puppeteer';
import {
  expectAssignable,
  expectError,
  expectNotAssignable,
  expectType,
} from 'tsd';

expectType<ProtocolType>('cdp');
expectNotAssignable<ProtocolType>('webDriverBiDi');

expectAssignable<ConnectOptions>({
  browserWSEndpoint: 'ws://example.test',
  protocol: 'cdp',
});
expectNotAssignable<ConnectOptions>({
  browserWSEndpoint: 'ws://example.test',
  protocol: 'webDriverBiDi',
});
expectNotAssignable<ConnectOptions>({
  browserWSEndpoint: 'ws://example.test',
  capabilities: {},
});
expectNotAssignable<ConnectOptions>({
  browserWSEndpoint: 'ws://example.test',
  channel: 'chrome',
});
expectNotAssignable<ConnectOptions>({
  browserWSEndpoint: 'ws://example.test',
  headers: {'X-Test': 'value'},
});

await connect({browserWSEndpoint: 'ws://example.test', protocol: 'cdp'});
await puppeteer.connect({
  browserWSEndpoint: 'ws://example.test',
  protocol: 'cdp',
});
expectError(
  connect({
    browserWSEndpoint: 'ws://example.test',
    protocol: 'webDriverBiDi',
  }),
);
expectError(
  puppeteer.connect({
    browserWSEndpoint: 'ws://example.test',
    protocol: 'webDriverBiDi',
  }),
);
expectError(
  connect({
    browserWSEndpoint: 'ws://example.test',
    channel: 'chrome',
  }),
);
expectError(
  puppeteer.connect({
    browserWSEndpoint: 'ws://example.test',
    headers: {'X-Test': 'value'},
  }),
);
