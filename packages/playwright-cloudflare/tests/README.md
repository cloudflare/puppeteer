# Testing Playwright with Cloudflare

The best way to test Playwright Cloudflare is to run the playwright test suite in a worker runtime environment.
To facilitate this, we have created some scripts that generate the necessary code to load these test files into workers.

These tests are then exposed through `testsServer` worker, which can be accessed via HTTP / WebSocket protocols.
This setup allows us to execute proxy tests using `vitest` that interact with the testsServer.

## Worker Tests

`workerTests` folder contains playwright original tests with few modifications, and are generated via a script.

All those tests are loaded by `testsServer` worker and made available to run in worker runtime.

## Proxy Tests

In the `proxyTests` folder, we maintain proxy files for each test, which are generated via a script.

These files are used to call the `testsServer` worker and execute the corresponding tests.

## Add Tests / Mark as skipped

It's possible to add more playwright tests by editing `src/tests.ts` and import them there, ensuring they have a `../workerTests` prefix.

Our generator script will be able to parse that file and process the new imported tests.

You can also ensure some tests are skipped by adding their full title into `skipTests` structure found in `src/tests.ts`.
