import {debug} from 'playwright-core/lib/utilsBundle';

export {asLocator, isUnderTest} from 'playwright-core/lib/utils';
export {debug} from 'playwright-core/lib/utilsBundle';
export {mergeTests} from 'playwright/lib/common/testType';
export * from 'playwright-core/lib/utilsBundle';
export * from 'playwright-core/lib/zipBundle';

// console.log is unavailable during Worker module initialization.
debug.log = (...args: any[]) => console.log(...args);
