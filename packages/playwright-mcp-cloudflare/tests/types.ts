import {createMcpAgent} from '@cloudflare/playwright-mcp';

import type {BrowserWorker} from '@cloudflare/playwright';

declare const browser: BrowserWorker;

createMcpAgent(browser, {vision: false, capabilities: ['core', 'tabs']});
createMcpAgent('https://example.com?browser_binding=BROWSER');
