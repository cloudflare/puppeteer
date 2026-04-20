import fs from 'fs';

import { asLocatorDescription, currentZone, ManualPromise, renderTitleForCall, setTimeOrigin, timeOrigin } from 'playwright-core/lib/utils';
import { loadConfig } from 'playwright/lib/common/configLoader';
import { currentTestInfo, setCurrentlyLoadingFileSuite } from 'playwright/lib/common/globals';
import { bindFileSuiteToProject } from 'playwright/lib/common/suiteUtils';
import { Suite, TestCase } from 'playwright/lib/common/test';
import { rootTestType } from 'playwright/lib/common/testType';
import { WorkerMain } from 'playwright/lib/worker/workerMain';
import { TestStepInternal } from 'playwright/lib/worker/testInfo';
import { debug } from 'playwright-core/lib/utilsBundle';

import { isUnsupportedOperationError } from './cloudflare/unsupportedOperations';

import playwright from '.';

import type { Attachment, SuiteInfo, TestCaseInfo, TestContext, TestResult } from '../internal';
import type { ClientInstrumentationListener } from 'playwright-core/lib/client/clientInstrumentation';
import { Project } from '../types/test';

export { isUnderTest, asLocator } from 'playwright-core/lib/utils';
export { debug } from 'playwright-core/lib/utilsBundle';
export { mergeTests } from 'playwright/lib/common/testType';

export * from 'playwright-core/lib/zipBundle';
export * from 'playwright-core/lib/utilsBundle';

// console.log must be called inside a function because it's undefined on startup
debug.log = (...args: any[]) => console.log(...args);

// @ts-ignore
export const _baseTest: TestType<{}, {}> = rootTestType.test;

export const _rootSuites: Suite[] = [];

export function setCurrentTestFile(file?: string) {
  if (!file) {
    setCurrentlyLoadingFileSuite(undefined);
    return;
  }

  const suite = new Suite(file, 'file');
  suite._requireFile = `/bundle/${file}`;
  suite.location = { file, line: 0, column: 0 };
  setCurrentlyLoadingFileSuite(suite);
  _rootSuites.push(suite);
}

function toInfo(test: Suite | TestCase): SuiteInfo | TestCaseInfo {
  if (test instanceof Suite) {
    return {
      type: test._type as any,
      file: test._requireFile!,
      title: test.title,
      fullTitle: test.titlePath().join(' > '),
      entries: test._entries.map(toInfo),
    };
  } else if (test instanceof TestCase) {
    return {
      type: 'test',
      file: test._requireFile!,
      title: test.title,
      fullTitle: test.titlePath().join(' > '),
      testId: test.id,
    };
  }

  throw new Error('Invalid test');
}

export const playwrightTestConfig = {
  projects: [
    {
      timeout: 5000,
      name: 'chromium',
      outputDir: '/tmp/test-results',
      testDir: '/bundle',
    } satisfies Partial<Project>,
  ],
};

export const configLocation = {
  resolvedConfigFile: '/bundle/playwright.config.ts',
  configDir: '/bundle',
};

async function bindSuites() {
  const fullConfig = await loadConfig(configLocation);
  const [project] = fullConfig.projects;
  return _rootSuites.map(s => bindFileSuiteToProject(project, s));
}

export async function testSuites(): Promise<SuiteInfo[]> {
  const suites = await bindSuites();
  return suites.map(toInfo) as SuiteInfo[];
}

class TestWorker extends WorkerMain {
  private _donePromise = new ManualPromise<TestResult>();
  private _attachments: Attachment[] = [];
  private _testResult?: TestResult;

  constructor(options?: { timeout?: number }) {
    super({
      workerIndex: 0,
      parallelIndex: 0,
      repeatEachIndex: 0,
      projectId: playwrightTestConfig.projects[0].name!,
      config: {
        location: configLocation,
        configCLIOverrides: {
          timeout: 5000,
          ...options,
        },
      },
      artifactsDir: `/tmp/tests`,
      recoverFromStepErrors: false,
    });
  }

  async testResult() {
    return await this._donePromise;
  }

  protected override dispatchEvent(method: string, params: any): void {
    if (method === 'attach') {
      const { name, body, path, contentType } = params;
      let fileContent: string | undefined;
      if (!body) {
        if (!path)
          throw new Error('Either body or path must be provided');
        if (!fs.existsSync(path))
          throw new Error(`File does not exist: ${path}`);
        fileContent = fs.readFileSync(path, 'base64') as string;
      }
      this._attachments.push({ name, body: body ?? fileContent, contentType });
    }

    if (method === 'testEnd')
      this._testResult = params;

    if (method === 'done') {
      if (!this._testResult) {
        this._testResult = {
          testId: params.testId,
          errors: params.fatalErrors ?? [],
          annotations: [],
          expectedStatus: 'passed',
          status: 'failed',
          hasNonRetriableError: false,
          duration: 0,
          timeout: 0,
        };
      }
      this._donePromise.resolve({
        ...this._testResult,
        attachments: this._attachments,
      });
    }
  }
}

let context: TestContext | undefined;

export function currentTestContext() {
  if (!context)
    throw new Error(`Test context not initialized`);
  return context;
}

export class TestRunner {
  private _testContext: TestContext;
  private _options: { timeout?: number; } | undefined;

  constructor(testContext: TestContext, options?: { timeout?: number }) {
    this._testContext = testContext;
    this._options = options;
  }

  async runTest(file: string, testId: string): Promise<TestResult> {
    // performance.timeOrigin is always 0 in Cloudflare Workers. Besides, Date.now() is 0 in global scope,
    // so we need to set it to the current time inside a event handler, where Date.now() is not 0.
    // https://stackoverflow.com/a/58491358
    if (timeOrigin() === 0 && Date.now() !== 0)
      setTimeOrigin(Date.now());

    context = this._testContext;
    const testWorker = new TestWorker(this._options);
    try {
      const { retry } = this._testContext;
      const [result] = await Promise.all([
        testWorker.testResult(),
        testWorker.runTestGroup({ file, entries: [{ testId, retry }] }),
      ]);
      if (result.status === 'failed' && result.errors.some(isUnsupportedOperationError)) {
        return {
          ...result,
          status: 'skipped',
          expectedStatus: 'skipped',
        };
      }
      return result;
    } finally {
      await testWorker.gracefullyClose();
      context = undefined;
    }
  }
}

const tracingGroupSteps: TestStepInternal[] = [];
// adapted from _setupArtifacts fixture in packages/playwright/src/index.ts
const expectApiListener: ClientInstrumentationListener = {
  onApiCallBegin: (data, channel) => {
    const testInfo = currentTestInfo();
    // Some special calls do not get into steps.
    if (!testInfo || data.apiName.includes('setTestIdAttribute') || data.apiName === 'tracing.groupEnd')
      return;
    const zone = currentZone().data<TestStepInternal>('stepZone');
    if (zone && zone.category === 'expect') {
      // Display the internal locator._expect call under the name of the enclosing expect call,
      // and connect it to the existing expect step.
      if (zone.apiName)
        data.apiName = zone.apiName;
      if (zone.title)
        data.title = zone.title;
      data.stepId = zone.stepId;
      return;
    }

    // In the general case, create a step for each api call and connect them through the stepId.
    const step = testInfo._addStep({
      location: data.frames[0],
      category: 'pw:api',
      title: renderTitle(channel.type, channel.method, channel.params, data.title),
      apiName: data.apiName,
      params: channel.params,
    }, tracingGroupSteps[tracingGroupSteps.length - 1]);
    data.userData = step;
    data.stepId = step.stepId;
    if (data.apiName === 'tracing.group')
      tracingGroupSteps.push(step);
  },
  onApiCallEnd: data => {
    // "tracing.group" step will end later, when "tracing.groupEnd" finishes.
    if (data.apiName === 'tracing.group')
      return;
    if (data.apiName === 'tracing.groupEnd') {
      const step = tracingGroupSteps.pop();
      step?.complete({ error: data.error });
      return;
    }
    const step = data.userData;
    step?.complete({ error: data.error });
  },
};

function renderTitle(type: string, method: string, params: Record<string, string> | undefined, title?: string) {
  const prefix = renderTitleForCall({ title, type, method, params });
  let selector;
  if (params?.['selector'] && typeof params.selector === 'string')
    selector = asLocatorDescription('javascript', params.selector);
  return prefix + (selector ? ` ${selector}` : '');
}

export async function runWithExpectApiListener<T>(fn: () => Promise<T>): Promise<T> {
  playwright._instrumentation.addListener(expectApiListener);
  try {
    return await fn();
  } finally {
    playwright._instrumentation.removeListener(expectApiListener);
  }
}
