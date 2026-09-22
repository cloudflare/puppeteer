import {AsyncLocalStorage} from 'async_hooks';

export const apiCallZone = new AsyncLocalStorage<{apiName: string}>();
