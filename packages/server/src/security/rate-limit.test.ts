import type { NextFunction, Request, Response } from 'express';
import { describe, expect, it, vi } from 'vitest';
import { clientKey, rateLimit, type RateLimitOptions } from './rate-limit.js';

function makeResponse() {
  const response = {
    statusCode: 200,
    headers: {} as Record<string, string>,
    body: undefined as unknown,
    setHeader(name: string, value: string) {
      this.headers[name.toLowerCase()] = value;
    },
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.body = payload;
      return this;
    },
  };
  return response;
}

const options = (now: () => number, extra: Partial<RateLimitOptions> = {}): RateLimitOptions => ({
  windowMs: 1000,
  max: 2,
  maxClients: 100,
  now,
  ...extra,
});

function send(limiter: ReturnType<typeof rateLimit>, ip: string | undefined) {
  const next = vi.fn();
  const response = makeResponse();
  limiter({ ip } as Request, response as unknown as Response, next as NextFunction);
  return { allowed: next.mock.calls.length === 1, response };
}

describe('rateLimit', () => {
  it('allows requests up to the limit, then rejects with Retry-After', () => {
    const limiter = rateLimit(options(() => 0));
    expect(send(limiter, '1.1.1.1').allowed).toBe(true);
    expect(send(limiter, '1.1.1.1').allowed).toBe(true);
    const blocked = send(limiter, '1.1.1.1');
    expect(blocked.allowed).toBe(false);
    expect(blocked.response.statusCode).toBe(429);
    expect(blocked.response.headers['retry-after']).toBe('1');
  });

  it('counts clients separately and resets when the window rolls over', () => {
    let clock = 0;
    const limiter = rateLimit(options(() => clock));
    send(limiter, 'a');
    send(limiter, 'a');
    expect(send(limiter, 'a').allowed).toBe(false);
    expect(send(limiter, 'b').allowed).toBe(true);
    clock = 1000;
    expect(send(limiter, 'a').allowed).toBe(true);
  });

  it('evicts expired windows first, then the oldest, when the table is full', () => {
    let clock = 0;
    const limiter = rateLimit(options(() => clock, { maxClients: 2, max: 1 }));
    send(limiter, 'a');
    clock = 500;
    send(limiter, 'b');
    // Table full, nothing expired: the oldest ('a') is dropped to admit 'c'.
    expect(send(limiter, 'c').allowed).toBe(true);
    expect(send(limiter, 'b').allowed).toBe(false);
    clock = 1600;
    // Both expired now: they are swept, and 'd' is admitted.
    expect(send(limiter, 'd').allowed).toBe(true);
  });

  it('copes with a zero-size table', () => {
    const limiter = rateLimit(options(() => 0, { maxClients: 0 }));
    expect(send(limiter, 'a').allowed).toBe(true);
  });

  it('uses the default options', () => {
    expect(send(rateLimit(), 'a').allowed).toBe(true);
  });
});

describe('clientKey', () => {
  it('uses the proxy-resolved address and never returns empty', () => {
    expect(clientKey({ ip: '203.0.113.5' })).toBe('203.0.113.5');
    expect(clientKey({ ip: undefined })).toBe('unknown');
  });
});
