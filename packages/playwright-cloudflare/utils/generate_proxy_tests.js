import path from 'path';
import {fileURLToPath} from 'url';

import {generateProxyTests} from '@cloudflare/browser-test-runtime/proxy';

const basedir = path.dirname(fileURLToPath(import.meta.url));

await generateProxyTests({
  proxyTestsDir: path.join(basedir, '..', 'tests', 'proxyTests'),
  proxyTestsModule: path.join(basedir, '..', 'tests', 'src', 'proxy', 'proxyTests.ts'),
});
