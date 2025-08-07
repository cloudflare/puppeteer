import path from 'path';
import {fileURLToPath} from 'url';

import {build} from 'vite';

import {deleteDir, listFiles, writeFile} from './utils.js';

const basedir = path.dirname(fileURLToPath(import.meta.url));

const excludedFiles = [
  'acceptInsecureCerts.spec.ts',
  'accessibility.spec.ts',
  'ariaqueryhandler.spec.ts',
  'autofill.spec.ts',
  'browser.spec.ts',
  'browsercontext-cookies.spec.ts',
  'browsercontext.spec.ts',
  'cdp/backendNodeId.spec.ts',
  'cdp/bfcache.spec.ts',
  'cdp/CDPSession.spec.ts',
  'cdp/devtools.spec.ts',
  'cdp/extensions.spec.ts',
  'cdp/pipe.spec.ts',
  'cdp/prerender.spec.ts',
  'cdp/queryObjects.spec.ts',
  'cdp/screencast.spec.ts',
  'cdp/TargetManager.spec.ts',
  'chromiumonly.spec.ts',
  'connect.spec.ts',
  'debugInfo.spec.ts',
  'defaultbrowsercontext.spec.ts',
  'device-request-prompt.spec.ts',
  'download.spec.ts',
  'emulation.spec.ts',
  'fixtures.spec.ts',
  'headful.spec.ts',
  'idle_override.spec.ts',
  'ignorehttpserrors.spec.ts',
  'launcher.spec.ts',
  'network.spec.ts',
  'proxy.spec.ts',
  'requestinterception-experimental.spec.ts',
  'requestinterception.spec.ts',
  'screenshot.spec.ts',
  'stacktrace.spec.ts',
  'target.spec.ts',
  'waittask.spec.ts',
  'worker.spec.ts',
];

const sourceTestsDir = path.join(basedir, '..', '..', '..', 'test', 'src');
const cloudflareSourceTestsDir = path.join(basedir, '..', 'tests', 'src');
const workerTestsDir = path.join(basedir, '..', 'tests', 'workerTests');

function setTestFilePlugin() {
  return {
    name: 'transform-file',
    transform(src, id) {
      const testPath = [sourceTestsDir, cloudflareSourceTestsDir]
        .map(dir => {
          return path.relative(dir, id).replace(/\\/g, '/');
        })
        .find(p => {
          return !p.startsWith('..');
        });
      if (/\.(spec|test)\.ts$/.test(id)) {
        return {
          code: [
            `import { setCurrentTestFile } from '@cloudflare/playwright/internal';setCurrentTestFile(${JSON.stringify(testPath)});globalThis.__dirname = ${JSON.stringify(path.dirname(testPath))};`,
            src,
            'setCurrentTestFile(undefined);',
          ].join('\n'),
          map: null, // provide source map if available
        };
      }
    },
  };
}

deleteDir(workerTestsDir);

// generate workerTests/index.ts file
const testFiles = listFiles(sourceTestsDir)
  .filter(file => {
    return /\.(test|spec)\.ts$/.test(file);
  })
  .filter(file => {
    return !excludedFiles.includes(
      path.relative(sourceTestsDir, file).replace(/\\/g, '/'),
    );
  })
  .map(file => {
    return `@workerTests/${path.relative(sourceTestsDir, file)}`
      .replace(/\\/g, '/')
      .replace(/\.ts$/, '');
  });

const cloudflareTestFiles = listFiles(cloudflareSourceTestsDir, {
  recursive: true,
})
  .filter(file => {
    return /\.(test|spec)\.ts$/.test(file);
  })
  .map(file => {
    return `@cloudflareTests/${path.relative(cloudflareSourceTestsDir, file)}`
      .replace(/\\/g, '/')
      .replace(/\.ts$/, '');
  });

writeFile(
  path.join(workerTestsDir, 'index.ts'),
  `import '../src/server/workerFixtures';

${[...testFiles, ...cloudflareTestFiles]
  .map(file => {
    return `import ${JSON.stringify(file)};`;
  })
  .join('\n')}
`,
);

(async () => {
  await build({
    plugins: [setTestFilePlugin()],
    root: sourceTestsDir,
    resolve: {
      alias: {
        // https://workers-nodejs-compat-matrix.pages.dev/
        async_hooks: 'node:async_hooks',
        assert: 'node:assert',
        buffer: 'node:buffer',
        child_process: 'node:child_process',
        constants: 'node:constants',
        crypto: 'node:crypto',
        dns: 'node:dns',
        domain: 'node:domain',
        events: 'node:events',
        http: 'node:http',
        http2: 'node:http2',
        https: 'node:https',
        inspector: 'node:inspector',
        module: 'node:module',
        net: 'node:net',
        os: 'node:os',
        path: 'node:path',
        querystring: 'node:querystring',
        process: 'node:process',
        readline: 'node:readline',
        stream: 'node:stream',
        string_decoder: 'node:string_decoder',
        tls: 'node:tls',
        url: 'node:url',
        util: 'node:util',
        vm: 'node:vm',
        zlib: 'node:zlib',

        '@workerTests': sourceTestsDir,
        '@cloudflareTests': path.resolve(basedir, '../tests/src'),

        '@pptr/testserver': path.resolve(
          basedir,
          '../tests/src/server/workerFixtures',
        ),

        'puppeteer-core/internal': '@cloudflare/puppeteer/internal',
        'puppeteer/lib/cjs/puppeteer/puppeteer.js': '@cloudflare/puppeteer',
        puppeteer: '@cloudflare/puppeteer',

        'fs/promises': path.resolve(basedir, '../tests/src/server/fsPromises'),
        'node:fs/promises': path.resolve(
          basedir,
          '../tests/src/server/fsPromises',
        ),

        // eslint-disable-next-line prettier/prettier
        'fs': '@cloudflare/playwright/fs',
        'node:fs': '@cloudflare/playwright/fs',

        './mocha-utils.js': path.resolve(
          basedir,
          '../tests/src/server/mocha-utils',
        ),

        sinon: path.resolve(basedir, '../tests/src/server/mocks/sinon.ts'),
      },
    },
    build: {
      emptyOutDir: false,
      minify: false,
      // prevents __defProp, __defNormalProp, __publicField in compiled code
      target: 'esnext',
      lib: {
        name: 'tests',
        entry: path.join(basedir, '../tests/workerTests/index.ts'),
        formats: ['es'],
      },
      terserOptions: {
        format: {
          // we need to ensure no comments are preserved
          comments: false,
        },
      },
      rollupOptions: {
        output: {
          preserveModules: true,
          dir: workerTestsDir,
          preserveModulesRoot: sourceTestsDir,
          entryFileNames: '[name].js',
          chunkFileNames: '[name].js',
        },
        external: [
          'node:async_hooks',
          'node:assert',
          'node:buffer',
          'node:child_process',
          'node:constants',
          'node:crypto',
          'node:dns',
          'node:domain',
          'node:events',
          'node:http',
          'node:http2',
          'node:https',
          'node:inspector',
          'node:module',
          'node:net',
          'node:os',
          'node:path',
          'node:querystring',
          'node:process',
          'node:readline',
          'node:stream',
          'node:string_decoder',
          'node:timers',
          'node:tls',
          'node:url',
          'node:util',
          'node:vm',
          'node:zlib',

          'cloudflare:workers',
          '@cloudflare/puppeteer/internal',
          '@cloudflare/puppeteer/internal/util/Deferred.js',
          '@cloudflare/puppeteer',
          '@cloudflare/playwright',
          '@cloudflare/playwright/test',
          '@cloudflare/playwright/internal',
          '@cloudflare/playwright/fs',
        ],
      },
      commonjsOptions: {
        transformMixedEsModules: true,
        extensions: ['.ts', '.js'],
        include: [path.resolve(basedir, '../../../test/**/*'), /node_modules/],
      },
    },
  });
})();
