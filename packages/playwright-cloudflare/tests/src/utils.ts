import { env } from 'cloudflare:workers';

import type { BrowserWorker } from '@cloudflare/playwright';

export type BrowserBindingName = 'BROWSER' | 'BROWSER_BRAPI_STAGING' | 'BROWSER_BRAPI_PRODUCTION';

export function getBinding(url: URL): BrowserWorker {
  const bindingName = url.searchParams.get('binding');
  if (!bindingName)
    return env.BROWSER as BrowserWorker;

  const binding = env[bindingName as keyof typeof env] as BrowserWorker;

  if (!binding)
    throw new Error(`Binding ${bindingName} not found in environment.`);


  return binding;
}
