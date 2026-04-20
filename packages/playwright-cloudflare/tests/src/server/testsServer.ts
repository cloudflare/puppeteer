import { TestRunner, TestEndPayload, isUnderTest, TestInfoError, TestResult } from '@cloudflare/playwright/internal';
import { DurableObject } from 'cloudflare:workers';
import '@workerTests/index';

import { skipTests, skipErrorMessages } from '../skipTests';
import { BrowserBindingName } from '../utils';

export type TestRequestPayload = {
  testId: string;
  fullTitle: string;
  timeout: number;
  retry: number;
};

// eslint-disable-next-line no-console
const log = console.log.bind(console);

const skipTestsFullTitles = new Set(skipTests);

function formatError(error: TestInfoError | Error | string) {
  if (typeof error === 'string')
    return error;
  return `${error.message}${error.stack ? `\n${error.stack}` : ''}`;
}

function shouldSkipTestResult(testResult: TestResult) {
  const errorText = testResult.errors.map(e => formatError(e)).join('\n');
  return skipErrorMessages.some(msg => typeof msg === 'string' ? errorText.includes(msg) : msg.test(errorText));
}

export class TestsServer extends DurableObject<Env> {
  constructor(state: DurableObjectState, env: Env) {
    super(state, env);
  }

  async fetch(request: Request): Promise<Response> {
    if (!isUnderTest())
      return new Response('Not under test', { status: 500 });

    const url = new URL(request.url);
    const file = url.pathname.substring(1);
    const sessionId = url.searchParams.get('sessionId');
    if (!sessionId)
      return new Response('sessionId is required', { status: 400 });
    const binding = url.searchParams.get('binding') as BrowserBindingName || 'BROWSER';

    const timeout = parseInt(url.searchParams.get('timeout') ?? '10', 10) * 1000;
    const { testId, fullTitle, retry } = await request.json() as TestRequestPayload;
    const assetsUrl = url.origin.replace(/^http:/, 'https:');
    const { env } = this;
    const context = { env, sessionId, assetsUrl, retry, binding };
    const testRunner = new TestRunner(context, { timeout });
    if (skipTestsFullTitles.has(fullTitle)) {
      log(`🚫 Skipping ${fullTitle}`);
      return Response.json({
        testId,
        status: 'skipped',
        errors: [],
        annotations: [
          {
            type: 'skip',
            description: `Test skipped because it is in the skipTests list`,
          }
        ],
        duration: 0,
        hasNonRetriableError: false,
        timeout,
        expectedStatus: 'skipped'
      } satisfies TestEndPayload);
    }

    log(`🧪 Running ${fullTitle}${retry ? ` (retry #${retry})` : ''}`);

    const result = await testRunner.runTest(file, testId);

    if (!['passed', 'skipped'].includes(result.status)) {
      if (shouldSkipTestResult(result)) {
        log(`🚫 Skipping ${fullTitle} because it failed with a known error message`);
        return Response.json({
          testId,
          status: 'skipped',
          errors: result.errors,
          annotations: [
            {
              type: 'skip',
              description: `Test skipped because it failed with a known error message`,
            }
          ],
          duration: 0,
          hasNonRetriableError: false,
          timeout,
          expectedStatus: 'skipped'
        } satisfies TestEndPayload);
      }
      const [error] = result.errors;       
      log(`❌ ${fullTitle} failed with status ${result.status}${error ? `: ${formatError(error)}` : ''}`);
    }
    return Response.json(result);
  }
}
