import { test, expect } from '@playwright/test';
import { retry } from './retry.js';

test('returns immediately on non-429', async () => {
  let calls = 0;
  const response = await retry(() => {
    calls++;
    return Promise.resolve(new Response('ok', { status: 200 }));
  });
  expect(calls).toBe(1);
  expect(response.status).toBe(200);
});

test('retries on 429 and succeeds', async () => {
  let calls = 0;
  const response = await retry(() => {
    calls++;
    if (calls === 1)
      return Promise.resolve(new Response('', { status: 429 }));
    return Promise.resolve(new Response('ok', { status: 200 }));
  }, { baseDelay: 1, jitterFactor: 0 });
  expect(calls).toBe(2);
  expect(response.status).toBe(200);
});

test('returns 429 after maxRetries exhausted', async () => {
  let calls = 0;
  const response = await retry(() => {
    calls++;
    return Promise.resolve(new Response('', { status: 429 }));
  }, { maxRetries: 2, baseDelay: 1, jitterFactor: 0 });
  expect(calls).toBe(3);
  expect(response.status).toBe(429);
});

test('honors retry-after header', async () => {
  let calls = 0;
  const start = Date.now();
  await retry(() => {
    calls++;
    if (calls === 1)
      return Promise.resolve(new Response('', { status: 429, headers: { 'retry-after': '1' } }));
    return Promise.resolve(new Response('ok', { status: 200 }));
  }, { maxRetries: 1, baseDelay: 1, jitterFactor: 0 });
  expect(Date.now() - start).toBeGreaterThanOrEqual(1000);
});

test('respects maxDelay cap', async () => {
  let calls = 0;
  const start = Date.now();
  await retry(() => {
    calls++;
    if (calls === 1)
      return Promise.resolve(new Response('', { status: 429, headers: { 'retry-after': '10' } }));
    return Promise.resolve(new Response('ok', { status: 200 }));
  }, { maxRetries: 1, baseDelay: 1, maxDelay: 50, jitterFactor: 0 });
  expect(Date.now() - start).toBeLessThan(1000);
});
