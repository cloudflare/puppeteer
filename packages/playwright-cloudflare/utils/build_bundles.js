import { build } from 'vite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const bundles = {
  // pngjs needs to bundle browserify-zlib, it throws an error when trying to use workers runtime zlib:
  // Error: Class constructor Inflate cannot be invoked without 'new'
  // Playwright's other dependencies now come from its root workspace.
  'pngjs': '../bundles/pngjs',
};

const external = [
  'assert',
  'async_hooks',
  'buffer',
  'child_process',
  'constants',
  'crypto',
  'dns',
  'events',
  'fs',
  'http',
  'http2',
  'https',
  'module',
  'net',
  'os',
  'path',
  'process',
  'stream',
  'string_decoder',
  'tls',
  'url',
  'util',
  // Node.js prefixed modules
  'node:crypto',
  'node:url',
  'node:stream',
  'node:http',
  'node:https',
  'node:http2',
  'node:buffer',
  'node:events',
  'node:async_hooks',
  'node:child_process',
  'node:fs',
  'node:path',
  'node:process',
  'node:util',
  'node:net',
  'node:string_decoder',
  'node:tls',
  'node:os',
];

const basedir = path.dirname(fileURLToPath(import.meta.url));

(async () => {
  for (const [name, bundleDir] of Object.entries(bundles)) {
    const root = path.join(basedir, bundleDir);
    const nodeModulesDir = path.join(root, 'node_modules');
    const nodeModulesLibs = fs.readdirSync(nodeModulesDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .flatMap(dirent => dirent.name.startsWith('@')
        // expand scoped packages (the ones that start with @)
        ? fs.readdirSync(path.join(nodeModulesDir, dirent.name), { withFileTypes: true })
          .filter(subdirent => subdirent.isDirectory())
          .map(subdirent => `${dirent.name}/${subdirent.name}`)
        : [dirent.name]);
    const jestDir = path.join(basedir, '..', '..', '..', 'submodules', 'jest');

    // we'll use jest packages source code instead of npm packages
    const jestPackages = Object.fromEntries(fs.readdirSync(path.join(jestDir, 'packages'), { withFileTypes: true })
      .filter(dirent => dirent.isDirectory() &&
        fs.existsSync(path.join(jestDir, 'packages', dirent.name, 'package.json')) &&
        fs.existsSync(path.join(jestDir, 'packages', dirent.name, 'src', 'index.ts')))
      .map(dirent => [
        JSON.parse(fs.readFileSync(path.join(jestDir, 'packages', dirent.name, 'package.json'), 'utf-8')).name,
        path.join(jestDir, 'packages', dirent.name, 'src', 'index.ts')
      ]));

    await build({
      root,
      // Jest is source input here, not a separately installed project.
      esbuild: { tsconfigRaw: {} },
      resolve: {
        dedupe: nodeModulesLibs,
        alias: {
          'node:events': 'events',
          'node:child_process': 'child_process',
          'node:path': 'path',
          'node:fs': 'fs',
          'node:process': 'process',
          'node:string_decoder': 'string_decoder',

          // jest npm package is commonjs, 
          ...jestPackages,

          'commander': path.join(basedir, '../src/mocks/commander'),
          'socks-proxy-agent': path.join(basedir, '../src/mocks/socksProxyAgent'),
          'open': path.join(basedir, '../src/mocks/open'),

          ...(name === 'pngjs' ? { 'zlib': 'browserify-zlib' } :
          { 'pngjs': path.join(basedir, `../src/bundles/pngjs.js` ) }),
        },
      },
      build: {
        emptyOutDir: false,
        minify: false,
        // prevents __defProp, __defNormalProp, __publicField in compiled code
        target: 'esnext',
        lib: {
          name,
          entry: path.join(root, `./src/${name}.ts`),
          formats: ['es'],
        },
        rollupOptions: {
          external: [
            ...(name === 'pngjs' ? external
              : [...external, 'zlib', 'pngjs'])
          ],
          output: {
            dir: path.join(basedir, '../src/bundles'),
            entryFileNames: `${name}.js`,
          },
        },
        commonjsOptions: {
          transformMixedEsModules: true,
          extensions: ['.ts', '.js'],
          include: [
            path.join(root, './src/**/*'),
            path.join(root, './node_modules/**/*'),
          ],
        }
      },
    });
  }
})();
