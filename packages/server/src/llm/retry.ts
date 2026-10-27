/**
 * Upstream statuses that mean "try again". 429 is deliberately absent: the free
 * tier caps requests per day, so retrying a quota rejection only spends more.
 */
const RETRYABLE_STATUSES: ReadonlySet<number> = new Set([500, 502, 503, 504]);

/** HTTP status Gemini uses when the quota is spent. */
export const QUOTA_EXCEEDED_STATUS = 429;

export interface RetryOptions {
  readonly attempts: number;
  readonly baseDelayMs: number;
  /** Injected so tests never wait in real time. */
  readonly delay: (ms: number) => Promise<void>;
}

/** The SDK reports the upstream status either as a field or as JSON inside the message. */
export function statusCodeOf(error: unknown): number | undefined {
  if (typeof error !== 'object' || error === null) {
    return undefined;
  }
  const { status, message } = error as { status?: unknown; message?: unknown };
  if (typeof status === 'number') {
    return status;
  }
  const match = typeof message === 'string' ? /"code"\s*:\s*(\d{3})/.exec(message) : null;
  return match === null ? undefined : Number(match[1]);
}

/** Whether the error is a transient upstream failure worth retrying. */
export const isRetryable = (error: unknown): boolean =>
  RETRYABLE_STATUSES.has(statusCodeOf(error) ?? 0);

/** Whether the error means the model quota is spent. */
export const isQuotaExceeded = (error: unknown): boolean =>
  statusCodeOf(error) === QUOTA_EXCEEDED_STATUS;

/** Exponential backoff for transient failures; anything else is rethrown at once. */
export async function withRetry<T>(
  operation: () => Promise<T>,
  { attempts, baseDelayMs, delay }: RetryOptions,
): Promise<T> {
  for (let attempt = 1; ; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      if (!isRetryable(error) || attempt >= attempts) {
        throw error;
      }
      await delay(baseDelayMs * 2 ** (attempt - 1));
    }
  }
}
