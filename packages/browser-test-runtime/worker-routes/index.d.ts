export interface VersionMetadataEnv {
  CF_VERSION_METADATA?: { id: string };
}

/** Responds to `GET /` with the test list and the `x-worker-version` header. */
export declare function testListResponse(suites: unknown, env: VersionMetadataEnv): Response;

/** Forwards a `/v1/*` request to the Browser Run binding. */
export declare function forwardToBrowserRun(
  request: Request,
  binding: { fetch(request: Request): Promise<Response> },
): Promise<Response>;

/** True for connect errors that mean Browser Run no longer serves the session. */
export declare function isSessionGoneError(message: string | undefined): boolean;

export interface SessionUnusableResult {
  testId: string;
  status: 'failed';
  expectedStatus: 'passed';
  errors: { message: string }[];
  annotations: { type: string; description?: string }[];
  duration: number;
  hasNonRetriableError: boolean;
  timeout: number;
  sessionUnusable: true;
}

/** A failed test result that tells the proxy to acquire a new session. */
export declare function sessionUnusableResult(options: {
  testId: string;
  timeout: number;
  sessionId: string;
  error: unknown;
}): SessionUnusableResult;
