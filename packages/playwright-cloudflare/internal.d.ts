import { isUnderTest } from 'playwright-core/lib/utils';
import { BrowserBindingName } from './tests/src/utils';

export * from './tests';
export { expect, _baseTest, Fixtures, mergeTests } from './types/test';

export type TestStatus = 'passed' | 'failed' | 'timedOut' | 'skipped' | 'interrupted';

export type TestBeginPayload = {
  testId: string;
  startWallTime: number;  // milliseconds since unix epoch
};

export type TestEndPayload = {
  testId: string;
  duration: number;
  status: TestStatus;
  errors: TestInfoError[];
  hasNonRetriableError: boolean;
  expectedStatus: TestStatus;
  annotations: { type: string, description?: string }[];
  timeout: number;
};

export type DonePayload = {
  fatalErrors: TestInfoError[];
  skipTestsDueToSetupFailure: string[];  // test ids
  fatalUnknownTestIds?: string[];
};

export interface TestInfoError {
  message?: string;
  stack?: string;
  value?: string;
}

export type SuiteInfo = {
  type: 'file' | 'describe';
  file: string;
  title: string;
  fullTitle: string;
  entries: (SuiteInfo | TestCaseInfo)[];
}

export type TestCaseInfo = {
  type: 'test';
  file: string;
  title: string;
  fullTitle: string;
  testId: string;
}

export function setCurrentTestFile(file?: string): void;
export function testSuites(): Promise<SuiteInfo[]>;

export type TestContext = {
  env: Env;
  sessionId: string;
  assetsUrl: string;
  retry: number;
  binding: BrowserBindingName;
};

export function currentTestContext(): TestContext;

export type Attachment = {
  name: string;
  body: string;
  contentType: string;
};

export type TestResult = TestEndPayload & {
  attachments?: Attachment[];
};

export class TestRunner {
  constructor(testContext: TestContext, options?: { timeout?: number });
  runTest(file: string, testId: string): Promise<TestResult>;
}

interface Debug {
  disable: () => string;
  enable: (namespaces: string) => void;
  enabled: (namespaces: string) => boolean;
}

export const debug: Debug;

export function isUnderTest(): boolean;

export async function runWithExpectApiListener<T>(fn: () => Promise<T>): Promise<T>;
