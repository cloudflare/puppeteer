import type { BrowserWorker } from "@cloudflare/puppeteer";
import { env } from "cloudflare:workers";

export class Skipped extends Error {
  constructor(message?: string) {
    super(message);
  }
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
