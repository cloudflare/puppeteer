import assert from 'node:assert/strict';

import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {StreamableHTTPClientTransport} from '@modelcontextprotocol/sdk/client/streamableHttp.js';

const endpoint = requiredUrl('MCP_SERVER_URL');
const accessClientId = requiredEnvironmentVariable('CF_ACCESS_CLIENT_ID');
const accessClientSecret = requiredEnvironmentVariable('CF_ACCESS_CLIENT_SECRET');
const requestTimeout = 60_000;

const accessProbe = await fetch(endpoint, {
  redirect: 'manual',
  signal: AbortSignal.timeout(10_000),
});
assert.ok(
  [301, 302, 303, 307, 308, 401, 403].includes(accessProbe.status),
  `Expected Cloudflare Access to reject an unauthenticated request, received HTTP ${accessProbe.status}`,
);

const transport = new StreamableHTTPClientTransport(endpoint, {
  requestInit: {
    headers: {
      'CF-Access-Client-Id': accessClientId,
      'CF-Access-Client-Secret': accessClientSecret,
    },
  },
});
const client = new Client({name: 'playwright-mcp-worker-smoke', version: '1.0.0'});
let connected = false;

try {
  await client.connect(transport);
  connected = true;
  await client.ping({timeout: requestTimeout});
  assert.ok(transport.sessionId, 'Expected the deployed MCP Worker to create a session');

  const {tools} = await client.listTools(undefined, {timeout: requestTimeout});
  assert.ok(
    tools.some(tool => tool.name === 'browser_navigate'),
    'Expected the deployed MCP Worker to expose browser_navigate',
  );

  const marker = `mcp-browser-run-smoke-${Date.now()}`;
  const result = await client.callTool({
    name: 'browser_navigate',
    arguments: {
      url: `data:text/html,${encodeURIComponent(`<title>${marker}</title><main>${marker}</main>`)}`,
    },
  }, undefined, {timeout: requestTimeout});

  assert.notEqual(result.isError, true, `browser_navigate failed: ${textContent(result)}`);
  const snapshot = await client.callTool({
    name: 'browser_snapshot',
  }, undefined, {timeout: requestTimeout});
  assert.notEqual(snapshot.isError, true, `browser_snapshot failed: ${textContent(snapshot)}`);
  assert.match(textContent(snapshot), new RegExp(marker), 'Browser Run snapshot did not contain the page marker');
  console.log('Deployed Playwright MCP Worker smoke test passed');
} finally {
  if (connected) {
    await client.callTool({name: 'browser_close'}, undefined, {timeout: 10_000}).catch(() => {});
    await transport.terminateSession().catch(() => {});
    await client.close().catch(() => {});
  }
}

function requiredEnvironmentVariable(name) {
  const value = process.env[name];
  if (!value)
    throw new Error(`${name} must be set`);
  return value;
}

function requiredUrl(name) {
  const value = requiredEnvironmentVariable(name);
  const url = new URL(value);
  if (url.protocol !== 'https:')
    throw new Error(`${name} must use HTTPS`);
  return url;
}

function textContent(result) {
  return result.content
      .filter(item => item.type === 'text')
      .map(item => item.text)
      .join('\n');
}
