/**
 * Configuration options for retry behavior.
 */
export type RetryOptions = {
  /** Maximum number of retry attempts (default: 3) */
  maxRetries?: number;
  /** Base delay in ms for exponential backoff (default: 1000) */
  baseDelay?: number;
  /** Maximum delay in ms, caps computed delay (default: 5000) */
  maxDelay?: number;
  /** Jitter factor for randomization (default: 0.5) */
  jitterFactor?: number;
};

export const defaultRetryOptions: Required<RetryOptions> = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 5000,
  jitterFactor: 0.5,
};

/**
 * Retry a fetch operation on 429 responses.
 * Honors the retry-after header when present, otherwise uses exponential backoff with jitter.
 */
export async function retry(
  fn: () => Promise<Response>,
  opts?: RetryOptions
): Promise<Response> {
  const { maxRetries, baseDelay, maxDelay, jitterFactor } = { ...defaultRetryOptions, ...opts };

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await fn();

    if (response.status !== 429)
      return response;

    if (attempt === maxRetries)
      return response;

    const retryAfter = parseRetryAfter(response.headers.get('retry-after'));
    const exponential = baseDelay * Math.pow(2, attempt);
    const base = Math.max(retryAfter ?? 0, exponential);
    const jitter = base * jitterFactor * (Math.random() * 2 - 1);
    const delay = Math.max(0, Math.min(base + jitter, maxDelay));
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  return undefined as never;
}

function parseRetryAfter(header: string | null): number | null {
  if (!header)
    return null;

  const seconds = parseInt(header, 10);
  if (!isNaN(seconds))
    return seconds * 1000;

  const date = Date.parse(header);
  if (!isNaN(date))
    return Math.max(0, date - Date.now());

  return null;
}
