import type { BrowserWorker } from "@cloudflare/puppeteer";
import { env } from "cloudflare:workers";

const SKIPPED_ERROR_PREFIX = 'Cloudflare Puppeteer test skipped: ';

export const TEST_SERVER_ROUTE_PREFIX = '/__puppeteer_test__/';
export const TEST_SERVER_ROUTE_HEADER = 'x-puppeteer-test-server';
export const TEST_SERVER_FALLBACK_HEADER = 'x-puppeteer-test-server-fallback';

export class Skipped extends Error {
  constructor(message?: string) {
    super(`${SKIPPED_ERROR_PREFIX}${message ?? 'unsupported operation'}`);
  }
}

export function isSkippedError(error: {message?: string}): boolean {
  return (
    error.message?.startsWith(SKIPPED_ERROR_PREFIX) ||
    error.message?.startsWith(`Error: ${SKIPPED_ERROR_PREFIX}`) ||
    false
  );
}

export function getBinding(url: URL): BrowserWorker {
  const bindingName = url.searchParams.get('binding');
  if (!bindingName) {
    return env.BROWSER as BrowserWorker;
  }
  const binding = env[bindingName as keyof typeof env] as BrowserWorker;

  if (!binding) {
    throw new Error(`Binding ${bindingName} not found in environment.`);
  } 

  return binding;
}
