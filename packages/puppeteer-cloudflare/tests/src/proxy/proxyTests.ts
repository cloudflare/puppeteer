import fs from 'fs';
import path from 'path';

import type {AcquireResponse, SessionsResponse} from '@cloudflare/puppeteer';
import {test as baseTest} from '@playwright/test';
import type {TestInfo} from '@playwright/test';

type TestPayload = Pick<
  TestInfo,
  'testId' | 'status' | 'expectedStatus' | 'errors' | 'annotations'
>;

export interface WorkerFixture {
  sessionId: string;
}

export const test = baseTest.extend<{}, WorkerFixture>({
  sessionId: [
    async ({}, use, workerInfo) => {
      const sessionFile = path.join(
        workerInfo.project.outputDir,
        `session-${workerInfo.parallelIndex}.json`,
      );
      let sessionId: string | undefined;
      if (fs.existsSync(sessionFile)) {
        const session = JSON.parse(
          fs.readFileSync(sessionFile, 'utf-8'),
        ) as AcquireResponse;
        for (let i = 0; i < 5; i++) {
          const response = await fetch(`${testsServerUrl}/v1/sessions`);
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
        const response = await fetch(`${testsServerUrl}/v1/acquire`);
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
  beforeAll: ({sessionId}: WorkerFixture) => Promise<void>;
  afterAll: () => Promise<void>;
  runTest: (
    test: {testId: string; fullTitle: string},
    testInfo: TestInfo,
  ) => Promise<void>;
}

export async function proxyTests(file: string): Promise<ProxyTests> {
  const url = new URL(`${testsServerUrl}/${file}`);

  return {
    beforeAll: async ({sessionId}: WorkerFixture) => {
      if (process.env.CI) {
        url.searchParams.set('timeout', '30');
      }
      if (sessionId) {
        url.searchParams.set('sessionId', sessionId);
      }
    },

    afterAll: async () => {},

    runTest: async (
      {testId, fullTitle}: {testId: string; fullTitle: string},
      testInfo: TestInfo,
    ) => {
      const response = await fetch(url, {
        body: JSON.stringify({testId, fullTitle}),
        method: 'POST',
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
