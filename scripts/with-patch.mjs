import {spawn, spawnSync} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const [submoduleName, ...command] = process.argv.slice(2);
if (!submoduleName || command.length === 0) {
  throw new Error('Usage: node scripts/with-patch.mjs <submodule> <command> [args...]');
}

const repositoryRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const submodulePath = path.join(repositoryRoot, 'submodules', submoduleName);
const patchPath = path.join(repositoryRoot, 'patches', `${submoduleName}.patch`);

function gitApply(args, stdio = 'pipe') {
  return spawnSync('git', ['-C', submodulePath, 'apply', ...args, patchPath], {
    encoding: 'utf8',
    stdio,
  });
}

let applied = false;
if (gitApply(['--reverse', '--check']).status !== 0) {
  const check = gitApply(['--check']);
  if (check.status !== 0) {
    process.stderr.write(check.stderr);
    throw new Error(`${submoduleName} patch does not apply cleanly`);
  }
  const result = gitApply([], 'inherit');
  if (result.status !== 0)
    process.exit(result.status ?? 1);
  applied = true;
}

function cleanup() {
  if (!applied)
    return;
  const result = gitApply(['--reverse'], 'inherit');
  applied = false;
  if (result.status !== 0)
    process.exitCode = result.status ?? 1;
}

process.once('exit', cleanup);

const child = spawn(command[0], command.slice(1), {
  cwd: process.cwd(),
  env: process.env,
  stdio: 'inherit',
});
const signals = ['SIGINT', 'SIGTERM'];
const signalHandlers = new Map(signals.map(signal => {
  const handler = () => child.kill(signal);
  process.once(signal, handler);
  return [signal, handler];
}));

const result = await new Promise(resolve => {
  child.once('error', error => resolve({error}));
  child.once('exit', (code, signal) => resolve({code, signal}));
});

for (const [signal, handler] of signalHandlers)
  process.removeListener(signal, handler);
cleanup();

if (result.error)
  throw result.error;
if (result.signal)
  process.kill(process.pid, result.signal);
else
  process.exitCode = result.code ?? 1;
