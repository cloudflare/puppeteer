import {dirname} from 'node:path';
import {puppeteerDirname} from './compat.js';

/**
 * @internal
 */
export const rootDirname = dirname(dirname(dirname(puppeteerDirname)));
