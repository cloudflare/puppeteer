import fs from 'fs';
import path from 'path';

import type {AcquireResponse, SessionsResponse} from '@cloudflare/puppeteer';
import {test as baseTest} from '@playwright/test';
import type {TestInfo} from '@playwright/test';

type TestPayload = Pick<
  TestInfo,
  'testId' | 'status' | 'expectedStatus' | 'errors' | 'annotations'
>;
export interface WorkerOptions {
  binding: 'BROWSER' | 'BROWSER_BRAPI_STAGING' | 'BROWSER_BRAPI_PRODUCTION';
}

export interface WorkerFixture {
  sessionId: string;
}

const authHeaders = {
  'CF-Access-Client-Id': process.env.CF_ACCESS_CLIENT_ID ?? '',
  'CF-Access-Client-Secret': process.env.CF_ACCESS_CLIENT_SECRET ?? '',
};

export const test = baseTest.extend<object, WorkerOptions & WorkerFixture>({
  binding: ['BROWSER', {option: true, scope: 'worker'}],
  sessionId: [
    async ({ binding }, use, workerInfo) => {
      const sessionFile = path.join(
        workerInfo.project.outputDir,
        `session_${binding}_${workerInfo.parallelIndex}.json`,
      );
      let sessionId: string | undefined;
      if (fs.existsSync(sessionFile)) {
        const session = JSON.parse(
          fs.readFileSync(sessionFile, 'utf-8'),
        ) as AcquireResponse;
        for (let i = 0; i < 5; i++) {
          const response = await fetch(`${testsServerUrl}/v1/sessions?binding=${binding}`, {
            headers: authHeaders,
          });
          const {sessions} = (await response.json()) as SessionsResponse;
          const activeSession = sessions.find(s => {
            return s.sessionId === session.sessionId;
          });

          if (!activeSession) {
            break;
          }

          if (!activeSession.connectionId) {
            sessionId = session.sessionId;
            break;
          }

          // wait for the session to be released and try again
          await new Promise(resolve => {
            return setTimeout(resolve, 1000);
          });
        }
      }

      if (!sessionId) {
        const response = await fetch(`${testsServerUrl}/v1/acquire?binding=${binding}`, {
          headers: authHeaders,
        });
        const session = (await response.json()) as AcquireResponse;
        fs.writeFileSync(sessionFile, JSON.stringify(session));
        sessionId = session.sessionId!;
      }

      await use(sessionId);
    },
    {scope: 'worker'},
  ],
});

const testsServerUrl = process.env.TESTS_SERVER_URL ?? `http://localhost:8787`;

interface ProxyTests {
  beforeAll: (fixtures: WorkerFixture & WorkerOptions) => Promise<void>;
  afterAll: () => Promise<void>;
  runTest: (
    test: {testId: string; fullTitle: string},
    testInfo: TestInfo,
  ) => Promise<void>;
}

export async function proxyTests(file: string): Promise<ProxyTests> {
  const url = new URL(`${testsServerUrl}/${file}`);

  return {
    beforeAll: async ({sessionId, binding}: WorkerFixture & WorkerOptions) => {
      if (process.env.CI) {
        url.searchParams.set('timeout', '30');
      }
      url.searchParams.set('sessionId', sessionId);
      url.searchParams.set('binding', binding);
    },

    afterAll: async () => {},

    runTest: async (
      {testId, fullTitle}: {testId: string; fullTitle: string},
      testInfo: TestInfo,
    ) => {
      const response = await fetch(url, {
        body: JSON.stringify({testId, fullTitle}),
        method: 'POST',
        headers: authHeaders,
      });
      if (!response.ok) {
        throw new Error(`Failed to run test ${fullTitle} (${testId})`);
      }

      const {status, expectedStatus, errors, annotations} =
        (await response.json()) as TestPayload;

      if (annotations) {
        testInfo.annotations.push(...annotations);
      }

      if (errors) {
        // if drop stacktrace because otherwise it tries to parse
        // the stacktrace from the worker and fails
        testInfo.errors = errors.map(({message, value}) => {
          return {message, value};
        });
      }

      testInfo.expectedStatus =
        status === 'skipped' ? 'skipped' : expectedStatus;
      testInfo.status = status;
    },
  };
}
