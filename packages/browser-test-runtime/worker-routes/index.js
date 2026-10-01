// Worker-side helpers shared by the test Workers. They are plain ES modules
// with no dependencies, so Wrangler bundles them without extra build steps.

// Responds to `GET /` with the test list. `x-worker-version` lets CI wait for
// a new deploy before it generates proxy specs from the list.
export function testListResponse(suites, env) {
  return Response.json(suites, {
    headers: { 'x-worker-version': env.CF_VERSION_METADATA?.id ?? '' },
  });
}

// Forwards a `/v1/*` request from the Node test runner to the Browser Run
// binding. The binding ignores the host, and `binding` only selects it here.
export function forwardToBrowserRun(request, binding) {
  const url = new URL(request.url);
  url.protocol = 'http:';
  url.host = 'fake.host';
  url.searchParams.delete('binding');
  return binding.fetch(new Request(url.toString(), request));
}

// Browser Run no longer serves the session: it is gone (404) or its browser
// is not running (410, for example "state: unhealthy").
const sessionGoneError = /Unable to connect to browser: code: (404|410)\b/;

export function isSessionGoneError(message) {
  return sessionGoneError.test(message ?? '');
}

// A failed test result for a session that the Worker cannot use. Return it
// instead of throwing: a thrown error reaches the proxy as a generic 1101 page
// and hides the Browser Run error. `sessionUnusable` makes the proxy acquire a
// new session for the retry.
export function sessionUnusableResult({ testId, timeout, sessionId, error }) {
  const message = `Unable to use Browser Run session ${sessionId}: ${error instanceof Error ? error.message : String(error)}`;
  return {
    testId,
    status: 'failed',
    expectedStatus: 'passed',
    errors: [{ message }],
    annotations: [{ type: 'session id', description: sessionId }],
    duration: 0,
    hasNonRetriableError: false,
    timeout,
    sessionUnusable: true,
  };
}
