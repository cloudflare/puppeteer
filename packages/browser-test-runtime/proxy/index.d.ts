// Types are structural so that this module does not depend on a specific
// `@playwright/test` version. The Playwright `TestInfo` and `WorkerInfo`
// objects satisfy them.

export declare function writeFile(filePath: string, content: string): void;
export declare function deleteDir(dirPath: string): void;
export declare function listFiles(dir: string, options?: { recursive?: boolean }): string[];

export interface ProxyWorkerFixtures<Binding extends string = string> {
  sessionId: string;
  binding: Binding;
}

export interface ProxyWorkerInfo {
  parallelIndex: number;
  project: { outputDir: string };
}

export interface ProxyTestInfo {
  retry: number;
  parallelIndex: number;
  project: { outputDir: string };
  annotations: { type: string; description?: string }[];
  errors: { message?: string; value?: string }[];
  attachments: { push(...attachments: any[]): number };
  expectedStatus: string;
  status?: string;
}

/**
 * Worker-scoped fixture that reuses the saved Browser Run session for the
 * worker's parallel index while it is still open, and otherwise acquires a new
 * one through the test Worker. Use it as
 * `sessionId: [browserSessionFixture, { scope: 'worker' }]`.
 */
export declare function browserSessionFixture(
  fixtures: { binding: string },
  use: (sessionId: string) => Promise<void>,
  workerInfo: ProxyWorkerInfo,
): Promise<void>;

export interface ProxyTests {
  beforeAll(fixtures: ProxyWorkerFixtures): Promise<void>;
  afterAll(): Promise<void>;
  runTest(test: { testId: string; fullTitle: string }, testInfo: ProxyTestInfo): Promise<void>;
}

/** Sends the tests of one Worker spec file to the deployed test Worker. */
export declare function proxyTests(file: string): Promise<ProxyTests>;

export interface GenerateProxyTestsOptions {
  /** Directory for the generated proxy specs. It is deleted first. */
  proxyTestsDir: string;
  /** Absolute path of the local module that exports `proxyTests` and `test`. */
  proxyTestsModule: string;
  /**
   * Worker version to wait for before reading the test list. Defaults to
   * `EXPECTED_WORKER_VERSION`; when unset, the first response is used.
   */
  expectedVersion?: string;
}

/**
 * Reads the test list from `TESTS_SERVER_URL` and writes one proxy spec per
 * Worker spec file.
 */
export declare function generateProxyTests(options: GenerateProxyTestsOptions): Promise<void>;
