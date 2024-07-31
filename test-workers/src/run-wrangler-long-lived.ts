import {fork} from 'node:child_process';
// eslint-disable-next-line no-restricted-imports
import events from 'node:events';
import path from 'node:path';

export const wranglerEntryPath = path.resolve(
  __dirname,
  '../node_modules/.bin/wrangler'
);

/**
 * Runs the command `wrangler dev` in a child process.
 *
 * Returns an object that gives you access to:
 *
 * - `ip` and `port` of the http-server hosting the pages project
 * - `stop()` function that will close down the server.
 */
export async function runWranglerDev(
  cwd: string,
  options: string[],
  env?: NodeJS.ProcessEnv
): Promise<{
  ip: string;
  port: number;
  stop: () => Promise<void>;
  getOutput: () => string;
  clearOutput: () => void;
}> {
  return runLongLivedWrangler(['dev', ...options], cwd, env);
}

async function runLongLivedWrangler(
  command: string[],
  cwd: string,
  env?: NodeJS.ProcessEnv
) {
  let settledReadyPromise = false;
  let resolveReadyPromise: (value: {ip: string; port: number}) => void;
  let rejectReadyPromise: (reason: unknown) => void;

  const ready = new Promise<{ip: string; port: number}>((resolve, reject) => {
    resolveReadyPromise = resolve;
    rejectReadyPromise = reject;
  });
  console.log(command);
  const wranglerProcess = fork(wranglerEntryPath, command, {
    stdio: [
      /* stdin */ 'ignore',
      /* stdout */ 'pipe',
      /* stderr */ 'pipe',
      'ipc',
    ],
    cwd,
    env: {...process.env, ...env, PWD: cwd},
  }).on('message', message => {
    if (settledReadyPromise) {
      return;
    }
    settledReadyPromise = true;
    clearTimeout(timeoutHandle);
    resolveReadyPromise(JSON.parse(message.toString()));
  });

  const chunks: Buffer[] = [];
  wranglerProcess.stdout?.on('data', chunk => {
    chunks.push(chunk);
  });
  wranglerProcess.stderr?.on('data', chunk => {
    chunks.push(chunk);
  });
  const getOutput = () => {
    return Buffer.concat(chunks).toString();
  };
  const clearOutput = () => {
    chunks.length = 0;
  };

  const timeoutHandle = setTimeout(() => {
    if (settledReadyPromise) {
      return;
    }
    settledReadyPromise = true;
    const separator = '='.repeat(80);
    const message = [
      'Timed out starting long-lived Wrangler:',
      separator,
      getOutput(),
      separator,
    ].join('\n');
    rejectReadyPromise(new Error(message));
  }, 50_000);

  async function stop() {
    const closePromise = events.once(wranglerProcess, 'close');
    wranglerProcess.kill('SIGTERM');
    const [code] = await closePromise;
    if (code) {
      throw new Error(`Exited with code ${code}`);
    }
  }

  const {ip, port} = await ready;
  return {ip, port, stop, getOutput, clearOutput};
}
