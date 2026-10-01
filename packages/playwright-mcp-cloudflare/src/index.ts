import { McpAgent } from 'agents/mcp';
import { env } from 'cloudflare:workers';

import type { BrowserEndpoint } from '@cloudflare/playwright';

import { endpointURLString } from '@cloudflare/playwright';
import { createConnection } from '../../../submodules/playwright-mcp/src/index.js';
import { ToolCapability } from '../../../submodules/playwright-mcp/config.js';

import type { Server } from '@modelcontextprotocol/sdk/server/index.js';

type Options = {
  vision?: boolean;
  capabilities?: ToolCapability[];
};

export function createMcpAgent(endpoint: BrowserEndpoint, options?: Options): typeof McpAgent<typeof env, {}, {}> {
  const cdpEndpoint = typeof endpoint === 'string'
    ? endpoint
    : endpoint instanceof URL
      ? endpoint.toString()
      : endpointURLString(endpoint);

  const connection = createConnection({
    capabilities: ['core', 'tabs', 'pdf', 'history', 'wait', 'files', 'testing'],
    browser: {
      cdpEndpoint,
    },
    ...options,
  });

  return class PlaywrightMcpAgent extends McpAgent<typeof env, {}, {}> {
    server = connection.then(server => server.server as unknown as Server);

    async init() {
      // do nothing
    }
  };
}
