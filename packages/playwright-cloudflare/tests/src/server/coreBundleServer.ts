import { deviceDescriptors } from '@isomorphic/deviceDescriptors';
import { parseCSS, serializeSelector } from '@isomorphic/cssParser';
import { asLocator, asLocatorDescription, asLocators } from '@isomorphic/locatorGenerators';
import { locatorOrSelectorAsSelector } from '@isomorphic/locatorParser';
import { ManualPromise } from '@isomorphic/manualPromise';
import { parseAttributeSelector } from '@isomorphic/selectorParser';
import { TraceLoader } from '@isomorphic/trace/traceLoader';
import { TraceModel } from '@isomorphic/trace/traceModel';
import { globToRegexPattern, urlMatches } from '@isomorphic/urlMatch';
import { hostPlatform } from '@utils/hostPlatform';
import { createHttpsServer } from '@utils/network';
import { parsePattern } from '@utils/socksProxy';
import { decodeWebp } from '@utils/webp/webp';
import { ZipFile } from '@utils/zipFile';
import { nullProgress } from 'packages/playwright-core/lib/server/progress';
import { DirTraceLoaderBackend, extractTrace } from 'packages/playwright-core/lib/tools/trace/traceParser';
import playwrightPackageJSON from '../../../../../submodules/playwright/packages/playwright-core/package.json';

export function getPlaywrightVersion(majorMinorOnly = false): string {
  const version = playwrightPackageJSON.version;
  return majorMinorOnly ? version.split('.').slice(0, 2).join('.') : version;
}

export const iso = {
  asLocator,
  asLocatorDescription,
  asLocators,
  globToRegexPattern,
  locatorOrSelectorAsSelector,
  ManualPromise,
  parseAttributeSelector,
  parseCSS,
  serializeSelector,
  TraceLoader,
  TraceModel,
  urlMatches,
};
export const server = { deviceDescriptors, nullProgress };
export const tools = { DirTraceLoaderBackend, extractTrace };
export const utils = { createHttpsServer, decodeWebp, hostPlatform, parsePattern, ZipFile };
