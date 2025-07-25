import path from 'path';
import {fileURLToPath} from 'url';

import {deleteDir, writeFile} from './utils.js';

const basedir = path.dirname(fileURLToPath(import.meta.url));

const testsServerUrl = process.env.TESTS_SERVER_URL ?? `http://localhost:8787`;
const proxyTestsDir = path.join(basedir, '..', 'tests', 'proxyTests');

// ensure proxyTestsDir directory is clean
deleteDir(proxyTestsDir);

function generateDescribeOrTest(entry, indent = '') {
  const title = entry.title.replace(/'/g, "\\'");
  const fullTitle = entry.fullTitle.replace(/'/g, "\\'");
  if (entry.type === 'describe') {
    return `${indent}test.describe(${JSON.stringify(title)}, async () => {
${entry.entries
  .map(entry => {
    return generateDescribeOrTest(entry, `${indent}  `);
  })
  .join('\n\n')}
${indent}});`;
  } else {
    return `${indent}test(${JSON.stringify(title)}, async ({}, testInfo) => await proxy.runTest({
${indent}  testId: ${JSON.stringify(entry.testId)},
${indent}  fullTitle: ${JSON.stringify(fullTitle)},
${indent}}, testInfo));`;
  }
}

(async () => {
  const suites = await fetch(`${testsServerUrl}`).then(res => {
    return res.json();
  });
  for (const suite of suites) {
    const targetProxyTestFile = path.join(proxyTestsDir, suite.file);
    const proxyTests = path.join(basedir, '../tests/src/proxy/proxyTests.ts');
    const relativePath = path
      .relative(path.dirname(targetProxyTestFile), proxyTests)
      .replace(/\\/g, '/');
    writeFile(
      targetProxyTestFile,
      `import { proxyTests, test } from '${relativePath}';

let proxy: any;

test.beforeAll(async ({ sessionId, binding }) => {
  proxy = await proxyTests('${suite.file}');
  await proxy.beforeAll({ sessionId, binding });
});

test.afterAll(async () => await proxy.afterAll());

${suite.entries
  .map(entry => {
    return generateDescribeOrTest(entry);
  })
  .join('\n\n')}
`,
    );
  }
})();
