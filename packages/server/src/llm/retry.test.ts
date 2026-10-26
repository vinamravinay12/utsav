import { describe, expect, it, vi } from 'vitest';
import { isQuotaExceeded, isRetryable, statusCodeOf, withRetry } from './retry.js';

const options = (delay = vi.fn(() => Promise.resolve())) => ({
  attempts: 3,
  baseDelayMs: 100,
  delay,
});

describe('statusCodeOf', () => {
  it('reads a status field or a code embedded in the message', () => {
    expect(statusCodeOf({ status: 503 })).toBe(503);
    expect(statusCodeOf(new Error('{"error":{"code":429,"message":"quota"}}'))).toBe(429);
    expect(statusCodeOf(new Error('plain failure'))).toBeUndefined();
    expect(statusCodeOf({ message: 7 })).toBeUndefined();
    expect(statusCodeOf('string')).toBeUndefined();
    expect(statusCodeOf(null)).toBeUndefined();
  });

  it('classifies transient and quota failures', () => {
    expect(isRetryable({ status: 503 })).toBe(true);
    expect(isRetryable({ status: 429 })).toBe(false);
    expect(isRetryable(new Error('no status'))).toBe(false);
    expect(isQuotaExceeded({ status: 429 })).toBe(true);
  });
});

describe('withRetry', () => {
  it('returns the first success', async () => {
    await expect(withRetry(() => Promise.resolve('ok'), options())).resolves.toBe('ok');
  });

  it('backs off exponentially on transient failures, then succeeds', async () => {
    const delay = vi.fn(() => Promise.resolve());
    const operation = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce({ status: 503 })
      .mockRejectedValueOnce({ status: 500 })
      .mockResolvedValue('ok');
    await expect(withRetry(operation, options(delay))).resolves.toBe('ok');
    expect(delay.mock.calls).toEqual([[100], [200]]);
  });

  it('gives up after the last attempt', async () => {
    const operation = vi.fn(() => Promise.reject(new Error('{"code":503}')));
    await expect(withRetry(operation, options())).rejects.toThrow('503');
    expect(operation).toHaveBeenCalledTimes(3);
  });

  it('does not retry a request that is wrong rather than unlucky', async () => {
    const operation = vi.fn(() => Promise.reject(Object.assign(new Error('bad'), { status: 400 })));
    await expect(withRetry(operation, options())).rejects.toThrow('bad');
    expect(operation).toHaveBeenCalledTimes(1);
  });
});
