import path from 'path';

import Mocha from 'mocha';

const mocha = new Mocha({dryRun: true}); // dryRun prevents actual test execution

// Add your test files
mocha.addFile(path.resolve(__dirname, 'test/example.test.js')); // Change this path accordingly

export interface TestInfoError {
  message?: string;
  stack?: string;
  value?: string;
}

export interface SuiteInfo {
  type: 'file' | 'describe';
  file: string;
  title: string;
  fullTitle: string;
  entries: Array<SuiteInfo | TestCaseInfo>;
}

export interface TestCaseInfo {
  type: 'test';
  file: string;
  title: string;
  fullTitle: string;
  testId: string;
}

function collectTest(
  mochaTest: Mocha.Suite | Mocha.Test,
): SuiteInfo | TestCaseInfo {
  if (mochaTest instanceof Mocha.Suite) {
    return {
      type: 'file',
      file: mochaTest.file!,
      title: mochaTest.title,
      fullTitle: mochaTest.fullTitle(),
      entries: [
        ...mochaTest.suites.map(collectTest),
        ...mochaTest.tests.map(collectTest),
      ],
    } satisfies SuiteInfo;
  } else {
    return {
      type: 'test',
      file: mochaTest.file!,
      title: mochaTest.title,
      fullTitle: mochaTest.fullTitle(),
      testId: mochaTest.id,
    } satisfies TestCaseInfo;
  }
}

export async function collectTests(testFiles: string[]): Promise<SuiteInfo> {
  for (const testFile of testFiles) {
    mocha.addFile(testFile);
  }
  await mocha.loadFilesAsync();
  return collectTest(mocha.suite) as SuiteInfo;
}
