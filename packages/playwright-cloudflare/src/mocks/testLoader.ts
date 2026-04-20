import { Suite } from 'playwright/lib/common/test';

import { _rootSuites } from '../internal';

export async function loadTestFile(file: string): Promise<Suite> {
  const suite = _rootSuites.find(s => s._requireFile === file);
  if (!suite)
    throw new Error(`Test file not found: ${file}`);
  return suite;
}
