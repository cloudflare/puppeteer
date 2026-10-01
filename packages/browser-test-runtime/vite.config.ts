import path from 'path';

import {defineConfig} from 'vite';

export default defineConfig({
  resolve: {
    alias: {
      'playwright-core/lib': path.resolve(
        __dirname,
        '../../submodules/playwright/packages/playwright-core/src',
      ),
      'playwright/lib': path.resolve(
        __dirname,
        '../../submodules/playwright/packages/playwright/src',
      ),
      'playwright-core': path.resolve(
        __dirname,
        './src/mocks/playwrightCore',
      ),
      'async_hooks': 'node:async_hooks',
      'assert': 'node:assert',
      'buffer': 'node:buffer',
      'constants': 'node:constants',
      'crypto': 'node:crypto',
      'dns': 'node:dns',
      'events': 'node:events',
      'fs': 'node:fs',
      'http': 'node:http',
      'http2': 'node:http2',
      'https': 'node:https',
      'module': 'node:module',
      'net': 'node:net',
      'os': 'node:os',
      'path': 'node:path',
      'process': 'node:process',
      'stream': 'node:stream',
      'string_decoder': 'node:string_decoder',
      'tls': 'node:tls',
      'url': 'node:url',
      'util': 'node:util',
      'zlib': 'node:zlib',
      './utilsBundleImpl': path.resolve(
        __dirname,
        './src/bundles/utilsBundleImpl.js',
      ),
      './zipBundleImpl': path.resolve(
        __dirname,
        './src/bundles/zipBundleImpl.js',
      ),
      './expectBundleImpl': path.resolve(
        __dirname,
        './src/bundles/expectBundleImpl.js',
      ),
      './mcpBundleImpl': path.resolve(
        __dirname,
        './src/bundles/mcpBundleImpl.js',
      ),
      'pngjs': path.resolve(__dirname, './src/bundles/pngjs.js'),
      'child_process': path.resolve(
        __dirname,
        './src/mocks/childProcess',
      ),
      'node:child_process': path.resolve(
        __dirname,
        './src/mocks/childProcess',
      ),
      'readline': path.resolve(__dirname, './src/mocks/readline'),
      'node:readline': path.resolve(
        __dirname,
        './src/mocks/readline',
      ),
      'inspector': path.resolve(__dirname, './src/mocks/inspector'),
      'node:inspector': path.resolve(
        __dirname,
        './src/mocks/inspector',
      ),
      './transport': path.resolve(
        __dirname,
        './src/cloudflare/webSocketTransport',
      ),
      '../transport': path.resolve(
        __dirname,
        './src/cloudflare/webSocketTransport',
      ),
      '@playwright-cloudflare': path.resolve(__dirname, './src'),
      './transform': path.resolve(__dirname, './src/mocks/transform'),
      '../transform/transform': path.resolve(__dirname, './src/mocks/transform'),
      '../transform/compilationCache': path.resolve(
        __dirname,
        './src/mocks/compilationCache',
      ),
      '../common/testLoader': path.resolve(
        __dirname,
        './src/mocks/testLoader',
      ),
      '../common/esmLoaderHost': path.resolve(
        __dirname,
        './src/mocks/esmLoaderHost',
      ),
      './esmLoaderHost': path.resolve(
        __dirname,
        './src/mocks/esmLoaderHost',
      ),
      '../playwright': path.resolve(__dirname, './src/mocks/empty'),
      './bidiOverCdp': path.resolve(__dirname, './src/mocks/empty'),
      'electron/index.js': path.resolve(
        __dirname,
        './src/mocks/empty',
      ),
    },
  },
  build: {
    minify: false,
    target: 'esnext',
    lib: {
      name: '@cloudflare/browser-test-runtime',
      entry: [path.resolve(__dirname, './src/index.ts')],
      formats: ['es'],
    },
    rollupOptions: {
      output: {
        format: 'es',
        dir: 'lib',
        entryFileNames: 'index.js',
        exports: 'named',
      },
      external: [
        /^node:/,
        'cloudflare:workers',
      ],
    },
    commonjsOptions: {
      transformMixedEsModules: true,
      extensions: ['.ts', '.js'],
      include: [
        path.resolve(
          __dirname,
          '../../submodules/playwright/packages/playwright-core/src/**/*',
        ),
        path.resolve(
          __dirname,
          '../../submodules/playwright/packages/playwright/src/**/*',
        ),
        /node_modules/,
      ],
    },
  },
});
