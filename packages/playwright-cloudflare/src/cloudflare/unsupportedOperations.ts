import { Playwright } from 'playwright-core/lib/client/playwright';

export function isUnsupportedOperationError(error: any): boolean {
  return error.message?.startsWith('Cloudflare Workers does not support browserType.');
}

export function unsupportedOperations(playwright: Playwright) {
  playwright.chromium.launch = async () => {
    throw new Error('Cloudflare Workers does not support browserType.launch.');
  };
  playwright.chromium.launchPersistentContext = async () => {
    throw new Error('Cloudflare Workers does not support browserType.launchPersistentContext.');
  };
  playwright.chromium.launchServer = async () => {
    throw new Error('Cloudflare Workers does not support browserType.launchServer.');
  };
  playwright.chromium.connect = async () => {
    throw new Error('Cloudflare Workers does not support browserType.connect.');
  };
}
