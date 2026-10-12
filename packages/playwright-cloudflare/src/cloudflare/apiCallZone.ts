import { AsyncLocalStorage } from 'async_hooks';

// stores the api call
export const apiCallZone = new AsyncLocalStorage<{ apiName: string }>();
