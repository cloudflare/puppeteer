import path from "path";
import { fileURLToPath } from "url";
import { deleteDir, listFiles, writeFile } from "./utils.js";

const basedir = path.dirname(fileURLToPath(import.meta.url));

const excludedFiles = [
  // Tests using formidable (Node.js server-side file upload parser)
  'page/page-filechooser.spec.ts',
  'page/page-set-input-files.spec.ts',
  'library/browsercontext-fetch.spec.ts',
  // Tests using TestServer (Node.js test infrastructure with mime, ws, etc.)
  'library/fetch-proxy.spec.ts',
  'library/route-web-socket.spec.ts',
  // Tests with dynamic require('@playwright/test') that bypasses aliases
  'library/selectors-register.spec.ts',
  // Tests using PNG/jpegjs from utilsBundle (require special bundling)
  'page/page-screenshot.spec.ts',
  'library/screenshot.spec.ts',
  'library/tracing.spec.ts',
  // Other incompatible tests
  'page/page-leaks.spec.ts',
  'library/browsertype-connect.spec.ts',
  'library/browsertype-launch-selenium.spec.ts',
  'library/browsertype-launch-server.spec.ts',
  'library/browsertype-launch.spec.ts',
  'library/client-certificates.spec.ts',
  'library/debug-controller.spec.ts',
  'library/headful.spec.ts',
  'library/har.spec.ts',
  'library/launcher.spec.ts',
  'library/heap.spec.ts',
  'library/snapshotter.spec.ts',
  'library/trace-viewer.spec.ts',
  'library/trace-viewer-scrub.spec.ts',
  'library/video.spec.ts',
  'library/screencast.spec.ts',
  'library/web-socket.spec.ts',
];

const sourceTestsDir = path.join(basedir, '..', '..', '..', 'submodules', 'playwright', 'tests');
const cloudflareSourceTestsDir = path.join(basedir, '..', 'tests', 'src');
const workerTestsDir = path.join(basedir, '..', 'tests', 'workerTests');

deleteDir(workerTestsDir);

// generate workerTests/index.ts file
const testFiles = ['page', 'library']
  .flatMap(dir => listFiles(path.join(sourceTestsDir, dir)))
  .filter(file => /\.(test|spec)\.ts$/.test(file))
  .filter(file => !excludedFiles.includes(path.relative(sourceTestsDir, file).replace(/\\/g, '/')))
  .map(file => `@workerTests/${path.relative(sourceTestsDir, file)}`.replace(/\\/g, '/').replace(/\.ts$/, ''));

const cloudflareTestFiles = listFiles(cloudflareSourceTestsDir, { recursive: true })
  .filter(file => /\.(test|spec)\.ts$/.test(file))
  .map(file => `@cloudflareTests/${path.relative(cloudflareSourceTestsDir, file)}`.replace(/\\/g, '/').replace(/\.ts$/, ''));

writeFile(path.join(
  workerTestsDir, 'index.ts'),
  [...testFiles, ...cloudflareTestFiles]
    .map(file => `import ${JSON.stringify(file)};`)
    .join('\n')
);
