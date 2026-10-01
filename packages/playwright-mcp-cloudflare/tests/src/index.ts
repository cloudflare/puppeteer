import {env} from 'cloudflare:workers';

import {createMcpAgent} from '@cloudflare/playwright-mcp';

export const PlaywrightMCP = createMcpAgent(env.BROWSER);

export default {
  fetch(request: Request, workerEnv: Env, ctx: ExecutionContext) {
    const {pathname} = new URL(request.url);
    if (pathname === '/sse' || pathname === '/sse/message')
      return PlaywrightMCP.serveSSE('/sse').fetch(request, workerEnv, ctx);
    if (pathname === '/mcp')
      return PlaywrightMCP.serve('/mcp').fetch(request, workerEnv, ctx);
    return new Response('Not Found', {status: 404});
  },
};
