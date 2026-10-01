import { mkdir, mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const repoRoot = path.resolve(import.meta.dirname, '..');
const packageDir = path.join(repoRoot, 'packages/playwright-cloudflare');
const temporaryDirectory = await mkdtemp(path.join(os.tmpdir(), 'cloudflare-playwright-pack-'));

function run(command, args, cwd) {
  const result = spawnSync(command, args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  if (result.status !== 0)
    throw new Error(`${command} ${args.join(' ')} failed:\n${result.stdout}${result.stderr}`);
  return result.stdout.trim();
}

async function assertFile(filePath) {
  const fileStat = await stat(filePath).catch(() => undefined);
  if (!fileStat?.isFile())
    throw new Error(`Packed package is missing ${path.relative(temporaryDirectory, filePath)}`);
}

try {
  const tarballName = run('npm', ['pack', '--pack-destination', temporaryDirectory, '--silent'], packageDir)
    .split('\n')
    .at(-1);
  const tarballPath = path.join(temporaryDirectory, tarballName);
  const consumerDir = path.join(temporaryDirectory, 'consumer');
  await mkdir(consumerDir);
  await writeFile(path.join(consumerDir, 'package.json'), '{"private":true,"type":"module"}\n');
  run('npm', ['install', '--ignore-scripts', '--no-audit', '--no-fund', tarballPath], consumerDir);

  const installedPackage = path.join(consumerDir, 'node_modules/@cloudflare/playwright');
  const requiredMetadata = [
    'lib/playwright-cloudflare/package.json.js',
    'lib/playwright-core/package.json.js',
    'lib/playwright-core/browsers.json.js',
  ];
  await Promise.all(requiredMetadata.map(file => assertFile(path.join(installedPackage, file))));

  const indexSource = await readFile(path.join(installedPackage, 'lib/index.js'), 'utf8');
  const versionModule = './playwright-cloudflare/package.json.js';
  if (!indexSource.includes(versionModule))
    throw new Error(`Packed lib/index.js does not reference ${versionModule}`);

  console.log(`Verified installed tarball ${tarballName}`);
} finally {
  await rm(temporaryDirectory, { recursive: true, force: true });
}
