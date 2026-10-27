import type { NextFunction, Request, Response } from 'express';

export interface RateLimitOptions {
  readonly windowMs: number;
  readonly max: number;
  /** Bounds memory: rotating addresses cannot grow the table without limit. */
  readonly maxClients: number;
  /** Injected so tests do not depend on the wall clock. */
  readonly now: () => number;
}

/** Generous for one person planning an event; far below scripted abuse of the model quota. */
const AI_RATE_LIMIT: RateLimitOptions = {
  windowMs: 60_000,
  max: 10,
  maxClients: 10_000,
  now: () => Date.now(),
};

/** One client's request count in the current fixed window. */
interface ClientWindow {
  count: number;
  readonly resetAt: number;
}

/**
 * The caller to count against.
 *
 * `request.ip` is resolved by Express from `trust proxy`: with one trusted hop
 * it is the address Google's front end appended — the right-most entry of
 * X-Forwarded-For — which the client cannot forge. Reading the left-most entry
 * instead would let any client pick its own bucket.
 */
export const clientKey = (request: Pick<Request, 'ip'>): string => request.ip ?? 'unknown';

/** Makes room in a full table: drops expired windows first, then the oldest one. */
function evict(windows: Map<string, ClientWindow>, now: number, maxClients: number): void {
  for (const [key, window] of windows) {
    if (window.resetAt <= now) {
      windows.delete(key);
    }
  }
  // Still full of live windows: drop the oldest rather than every client's count.
  const oldest = windows.keys().next();
  if (windows.size >= maxClients && oldest.done !== true) {
    windows.delete(oldest.value);
  }
}

/**
 * Fixed-window limiter, in memory.
 *
 * Per instance by design: its job is to stop one client exhausting the shared
 * upstream model quota, not to be a precise global counter.
 */
export function rateLimit(options: RateLimitOptions = AI_RATE_LIMIT) {
  const windows = new Map<string, ClientWindow>();
  return (request: Request, response: Response, next: NextFunction): void => {
    const client = clientKey(request);
    const now = options.now();
    const existing = windows.get(client);
    if (existing === undefined || existing.resetAt <= now) {
      if (windows.size >= options.maxClients) {
        evict(windows, now, options.maxClients);
      }
      windows.set(client, { count: 1, resetAt: now + options.windowMs });
      next();
      return;
    }
    existing.count += 1;
    if (existing.count > options.max) {
      response.setHeader('Retry-After', String(Math.ceil((existing.resetAt - now) / 1000)));
      response
        .status(429)
        .json({ error: 'Too many requests. Please wait a moment and try again.' });
      return;
    }
    next();
  };
}
