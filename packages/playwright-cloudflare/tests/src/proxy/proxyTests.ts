import path from 'path';
import fs from 'fs';

import { test as baseTest } from '@playwright/test';

import { BrowserBindingName } from '../utils';

import type { AcquireResponse } from '@cloudflare/playwright';
import type { TestResult } from '@cloudflare/playwright/internal';
import type { TestInfo } from '@playwright/test';

type TestPayload = Pick<TestResult, 'testId' | 'status' | 'expectedStatus' | 'errors' | 'annotations' | 'attachments'>;

export type WorkerFixture = {
  sessionId: string;
};
export interface WorkerOptions {
  binding: BrowserBindingName;
}

const authHeaders = {
  'CF-Access-Client-Id': process.env.CF_ACCESS_CLIENT_ID ?? '',
  'CF-Access-Client-Secret': process.env.CF_ACCESS_CLIENT_SECRET ?? '',
};

export const test = baseTest.extend<{}, WorkerFixture & WorkerOptions>({
  binding: ['BROWSER', { option: true, scope: 'worker' }],
  sessionId: [async ({ binding }, use, workerInfo) => {
    const sessionFile = path.join(workerInfo.project.outputDir, `session_${binding}_${workerInfo.parallelIndex}.json`);
    let sessionId: string | undefined;
    if (fs.existsSync(sessionFile)) {
      const session = JSON.parse(fs.readFileSync(sessionFile, 'utf-8')) as AcquireResponse;
      for (let i = 0; i < 5; i++) {
        const response = await fetch(`${testsServerUrl}/v1/devtools/session/${session.sessionId}?binding=${binding}`, {
          headers: authHeaders,
        });
        if (response.ok) {
          sessionId = session.sessionId;
          break;
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    if (!sessionId) {
      const response = await fetch(`${testsServerUrl}/v1/devtools/browser?binding=${binding}`, {
        method: 'POST',
        headers: authHeaders
      });
      const session = await response.json() as AcquireResponse;
      fs.writeFileSync(sessionFile, JSON.stringify(session));
      sessionId = session.sessionId!;
    }

    await use(sessionId);
  }, { scope: 'worker' }],
});

const testsServerUrl = process.env.TESTS_SERVER_URL ?? `http://localhost:8787`;

type ProxyTests = {
  beforeAll: (fixtures: WorkerFixture & WorkerOptions) => Promise<void>;
  afterAll: () => Promise<void>;
  runTest: (test: {testId: string; fullTitle: string}, testInfo: TestInfo) => Promise<void>;
};

export async function proxyTests(file: string): Promise<ProxyTests> {

  const url = new URL(`${testsServerUrl}/${file}`);

  return {
    beforeAll: async ({ sessionId, binding }: WorkerFixture & WorkerOptions) => {
      if (process.env.CI)
        url.searchParams.set('timeout', '60');
      url.searchParams.set('sessionId', sessionId);
      url.searchParams.set('binding', binding);
    },

    afterAll: async () => {
    },

    runTest: async ({ testId, fullTitle }: { testId: string, fullTitle: string }, testInfo: TestInfo) => {
      const response = await fetch(url, {
        body: JSON.stringify({ testId, fullTitle, retry: testInfo.retry }),
        method: 'POST',
        headers: authHeaders
      });
      if (!response.ok)
        throw new Error(`Failed to run test ${fullTitle} (${testId})`);

      const { status, expectedStatus, errors, annotations, attachments } = await response.json() as TestPayload;

      if (annotations)
        testInfo.annotations.push(...annotations);

      if (errors)
        // if drop stacktrace because otherwise it tries to parse the stacktrace from the worker
        // and fails
        testInfo.errors = errors.map(({ message, value }) => ({ message, value }));

      testInfo.expectedStatus = status === 'skipped' ? 'skipped' : expectedStatus;
      testInfo.status = status;

      if (attachments) {
        testInfo.attachments.push(...attachments.map(({ name, body, contentType }) => ({
          name,
          body: Buffer.from(body, 'base64'),
          contentType,
        })));
      }
    }
  };
}
