// Node-side helpers shared by the Worker test harnesses. The Playwright test
// runner in Node drives tests that run inside a deployed test Worker: it
// generates one proxy spec per Worker spec file and sends each test to the
// Worker, which runs it against Browser Run.
//
// This module must not import `@playwright/test`. Each test project installs
// its own version, and two loaded copies break Playwright. Callers pass their
// own `test` object to `extend` with `browserSessionFixture`.

import fs from 'fs';
import path from 'path';

export function writeFile(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, { encoding: 'utf-8' });
}

export function deleteDir(dirPath) {
  fs.rmSync(dirPath, { recursive: true, force: true });
}

export function listFiles(dir, options) {
  const files = [];
  for (const file of fs.readdirSync(dir).sort()) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory() && options?.recursive)
      files.push(...listFiles(fullPath, options));
    else if (stat.isFile())
      files.push(fullPath);
  }
  return files;
}

function testsServerUrl() {
  return process.env.TESTS_SERVER_URL ?? 'http://localhost:8787';
}

function authHeaders() {
  return {
    'CF-Access-Client-Id': process.env.CF_ACCESS_CLIENT_ID ?? '',
    'CF-Access-Client-Secret': process.env.CF_ACCESS_CLIENT_SECRET ?? '',
  };
}

// Retries get a new workerIndex but keep their parallelIndex, so a test and its
// retry share the saved session instead of leaking one session per retry.
function sessionFilePath(outputDir, binding, parallelIndex) {
  return path.join(outputDir, `session_${binding}_${parallelIndex}.json`);
}

// The session details endpoint also returns 200 for sessions that already
// ended (for example, after the browser crashed).
function isOpenSession(details) {
  if (!details || typeof details !== 'object')
    return false;
  const { endTime, closeReason, closeReasonText } = details;
  return endTime === undefined && closeReason === undefined && closeReasonText === undefined;
}

async function reusableSessionId(sessionFile, binding) {
  if (!fs.existsSync(sessionFile))
    return undefined;
  const { sessionId } = JSON.parse(fs.readFileSync(sessionFile, 'utf-8'));
  // A just-acquired session can take a moment to become visible.
  for (let attempt = 0; attempt < 5; attempt++) {
    const response = await fetch(`${testsServerUrl()}/v1/devtools/session/${sessionId}?binding=${binding}`, {
      headers: authHeaders(),
    });
    if (response.ok)
      return isOpenSession(await response.json()) ? sessionId : undefined;
    await response.body?.cancel();
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  return undefined;
}

async function acquireSession(sessionFile, binding) {
  const response = await fetch(`${testsServerUrl()}/v1/devtools/browser?binding=${binding}`, {
    method: 'POST',
    headers: authHeaders(),
  });
  const body = await response.text();
  if (!response.ok)
    throw new Error(`Failed to acquire browser session (${response.status} ${response.statusText}): ${body}`);
  const session = JSON.parse(body);
  if (!session.sessionId)
    throw new Error('Browser session response did not include a sessionId');
  fs.writeFileSync(sessionFile, JSON.stringify(session));
  return session.sessionId;
}

// Worker-scoped fixture: `sessionId: [browserSessionFixture, { scope: 'worker' }]`.
export async function browserSessionFixture({ binding }, use, workerInfo) {
  const sessionFile = sessionFilePath(workerInfo.project.outputDir, binding, workerInfo.parallelIndex);
  const sessionId = await reusableSessionId(sessionFile, binding) ?? await acquireSession(sessionFile, binding);
  await use(sessionId);
}

export async function proxyTests(file) {
  const url = new URL(file, `${testsServerUrl().replace(/\/$/, '')}/`);

  return {
    beforeAll: async ({ sessionId, binding }) => {
      url.searchParams.set('timeout', '45');
      url.searchParams.set('sessionId', sessionId);
      url.searchParams.set('binding', binding);
    },

    afterAll: async () => {},

    runTest: async ({ testId, fullTitle }, testInfo) => {
      const requestUrl = new URL(url);
      requestUrl.searchParams.set('retry', String(testInfo.retry));
      const response = await fetch(requestUrl, {
        body: JSON.stringify({ testId, fullTitle, retry: testInfo.retry }),
        method: 'POST',
        headers: authHeaders(),
      });
      if (!response.ok) {
        const body = await response.text();
        throw new Error(`Failed to run test ${fullTitle} (${testId}): ${response.status} ${response.statusText}: ${body}`);
      }

      const { status, expectedStatus, errors, annotations, attachments, sessionUnusable } = await response.json();

      if (sessionUnusable) {
        // The Worker could not use this Browser Run session (for example,
        // the browser became unhealthy). Forget it so that the retry, which
        // runs in a new worker, acquires a fresh session.
        const binding = url.searchParams.get('binding') ?? 'BROWSER';
        fs.rmSync(sessionFilePath(testInfo.project.outputDir, binding, testInfo.parallelIndex), { force: true });
      }

      if (annotations)
        testInfo.annotations.push(...annotations);

      if (errors) {
        // Drop the Worker stack traces: the runner tries to parse them as
        // local paths and fails.
        testInfo.errors = errors.map(({ message, value }) => ({ message, value }));
      }

      testInfo.expectedStatus = status === 'skipped' ? 'skipped' : expectedStatus;
      testInfo.status = status;

      if (attachments) {
        testInfo.attachments.push(...attachments.map(({ name, body, contentType }) => ({
          name,
          body: Buffer.from(body, 'base64'),
          contentType,
        })));
      }
    },
  };
}

// A new deploy takes a few seconds to reach every edge location. When CI
// passes the deployed version, wait until that version serves the test list;
// otherwise test IDs can come from the previous version.
async function fetchSuites(expectedVersion) {
  const deadline = Date.now() + 180_000;
  for (;;) {
    const response = await fetch(testsServerUrl(), { headers: authHeaders() });
    if (!response.ok)
      throw new Error(`Unable to list tests from ${testsServerUrl()}: ${response.status} ${response.statusText}`);
    const version = response.headers.get('x-worker-version');
    if (!expectedVersion || version === expectedVersion)
      return await response.json();
    if (Date.now() > deadline)
      throw new Error(`Test Worker still serves version ${version || '<none>'}, expected ${expectedVersion}`);
    await response.body?.cancel();
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
}

function generateDescribeOrTest(entry, indent = '') {
  // JSON.stringify produces valid, fully escaped JS string literals, so titles
  // are passed through unchanged and still match skip-list full titles.
  const { title, fullTitle } = entry;
  if (entry.type === 'describe') {
    return `${indent}test.describe(${JSON.stringify(title)}, async () => {
${entry.entries.map(child => generateDescribeOrTest(child, `${indent}  `)).join('\n\n')}
${indent}});`;
  }
  return `${indent}test(${JSON.stringify(title)}, async ({}, testInfo) => await proxy.runTest({
${indent}  testId: ${JSON.stringify(entry.testId)},
${indent}  fullTitle: ${JSON.stringify(fullTitle)},
${indent}}, testInfo));`;
}

// Writes one proxy spec per test file served by the deployed test Worker.
// `proxyTestsModule` is the local module that exports `proxyTests` and `test`.
export async function generateProxyTests({ proxyTestsDir, proxyTestsModule, expectedVersion = process.env.EXPECTED_WORKER_VERSION }) {
  deleteDir(proxyTestsDir);
  const suites = await fetchSuites(expectedVersion);
  for (const suite of suites) {
    const targetProxyTestFile = path.join(proxyTestsDir, suite.file);
    const relativePath = path.relative(path.dirname(targetProxyTestFile), proxyTestsModule).replace(/\\/g, '/');
    writeFile(targetProxyTestFile, `import { proxyTests, test } from '${relativePath}';

let proxy: any;

test.beforeAll(async ({ sessionId, binding }) => {
  proxy = await proxyTests('${suite.file}');
  await proxy.beforeAll({ sessionId, binding });
});

test.afterAll(async () => await proxy.afterAll());

${suite.entries.map(entry => generateDescribeOrTest(entry)).join('\n\n')}
`);
  }
}
