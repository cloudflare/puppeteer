import path from 'path';

import { defineConfig } from 'vite';

const playwrightMcpRoot = path.resolve(__dirname, '../../submodules/playwright-mcp').replace(/\\/g, '/');
const packageRoot = __dirname.replace(/\\/g, '/');

function entryFileName(chunkInfo: { facadeModuleId: string | null; name: string }): string {
  const id = chunkInfo.facadeModuleId?.replace(/\\/g, '/');
  if (!id)
    return '[name].js';
  if (id === `${packageRoot}/src/index.ts`)
    return 'index.js';
  if (id === `${packageRoot}/src/package.ts`)
    return 'package.js';
  if (id === `${packageRoot}/package.json`)
    return 'cloudflare/package.json.js';
  if (id.startsWith(`${playwrightMcpRoot}/src/`))
    return `src/${id.slice(`${playwrightMcpRoot}/src/`.length).replace(/\.[^.]+$/, '.js')}`;
  if (id.startsWith(`${playwrightMcpRoot}/node_modules/`))
    return `node_modules/${id.slice(`${playwrightMcpRoot}/node_modules/`.length).replace(/\.[^.]+$/, '.js')}`;
  return '[name].js';
}

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      // https://workers-nodejs-compat-matrix.pages.dev/
      'async_hooks': 'node:async_hooks',
      'assert': 'node:assert',
      'buffer': 'node:buffer',
      'child_process': 'node:child_process',
      'constants': 'node:constants',
      'crypto': 'node:crypto',
      'dns': 'node:dns',
      'events': 'node:events',
      'http': 'node:http',
      'http2': 'node:http2',
      'https': 'node:https',
      'inspector': 'node:inspector',
      'module': 'node:module',
      'net': 'node:net',
      'os': 'node:os',
      'path': 'node:path',
      'process': 'node:process',
      'readline': 'node:readline',
      'stream': 'node:stream',
      'tls': 'node:tls',
      'url': 'node:url',
      'util': 'node:util',
      'zlib': 'node:zlib',

      'playwright-core': '@cloudflare/playwright',
      'playwright': '@cloudflare/playwright/test',
      // Keep @cloudflare/playwright at ^0.0.11 while matching the current
      // Cloudflare MCP fork. That release provides the Workers-compatible
      // memfs export used by these aliases; modern releases removed ./fs.
      'node:fs': '@cloudflare/playwright/fs',
      'fs': '@cloudflare/playwright/fs',

      './package.js': path.resolve(__dirname, './src/package.ts'),
    },
  },
  build: {
    assetsInlineLimit: 0,
    // skip code obfuscation
    minify: false,
    lib: {
      name: '@cloudflare/playwright',
      entry: [
        path.resolve(__dirname, './src/index.ts'),
      ],
    },
    // prevents __defProp, __defNormalProp, __publicField in compiled code
    target: 'esnext',
    rollupOptions: {
      output: [
        {
          format: 'es',
          dir: 'lib/esm',
          preserveModules: true,
          preserveModulesRoot: 'src',
          entryFileNames: entryFileName,
          chunkFileNames: '[name].js',
        },
        {
          format: 'cjs',
          dir: 'lib/cjs',
          preserveModules: true,
          preserveModulesRoot: 'src',
          entryFileNames: entryFileName,
          chunkFileNames: '[name].js',
          exports: 'named',
        },
      ],
      external: [
        'node:async_hooks',
        'node:assert',
        'node:browser',
        'node:buffer',
        'node:child_process',
        'node:constants',
        'node:crypto',
        'node:dns',
        'node:events',
        'node:http',
        'node:http2',
        'node:https',
        'node:inspector',
        'node:module',
        'node:net',
        'node:os',
        'node:path',
        'node:process',
        'node:readline',
        'node:stream',
        'node:timers',
        'node:tls',
        'node:url',
        'node:util',
        'node:zlib',

        '@cloudflare/playwright',
        '@cloudflare/playwright/test',
        '@cloudflare/playwright/fs',
        'cloudflare:workers',

        /@modelcontextprotocol\/sdk\/.*/,
        'agents/mcp',
        'yaml',
        'zod',
        'zod-to-json-schema',
      ]
    },
    commonjsOptions: {
      transformMixedEsModules: true,
      extensions: ['.ts', '.js'],
      include: [
        path.resolve(__dirname, '../../submodules/playwright-mcp/src/**/*'),
        /node_modules/,
      ],
    }
  },
});
