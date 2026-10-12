import assert from 'node:assert/strict';
import test from 'node:test';

import {verifyReleaseCandidate} from './verify-npm-release.mjs';

const metadata = {
  versions: {
    '1.5.0': {},
    '2.0.0-next.0': {},
  },
  'dist-tags': {
    latest: '1.5.0',
    next: '2.0.0-next.0',
  },
};

test('allows a stable patch above latest when next is on a newer line', () => {
  assert.doesNotThrow(() => verifyReleaseCandidate(packageJson('1.5.1'), metadata));
});

test('rejects an existing version', () => {
  assert.throws(
    () => verifyReleaseCandidate(packageJson('1.5.0'), metadata),
    /is already published/,
  );
});

test('rejects a stable version that does not advance latest', () => {
  assert.throws(
    () => verifyReleaseCandidate(packageJson('1.4.1'), metadata),
    /newer than the latest dist-tag 1\.5\.0/,
  );
});

test('rejects a prerelease that would move next backwards', () => {
  assert.throws(
    () => verifyReleaseCandidate(packageJson('1.6.0-next.0'), metadata),
    /newer than the next dist-tag 2\.0\.0-next\.0/,
  );
});

test('allows a prerelease that advances latest and next', () => {
  assert.doesNotThrow(() => verifyReleaseCandidate(packageJson('2.0.0-next.1'), metadata));
});

function packageJson(version) {
  return {name: '@cloudflare/test-package', version};
}
