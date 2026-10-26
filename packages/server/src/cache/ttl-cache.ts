import { createHash } from 'node:crypto';

interface Entry<V> {
  readonly value: V;
  readonly expiresAt: number;
}

export interface TtlCache<V> {
  get(key: string): V | undefined;
  set(key: string, value: V): void;
  readonly size: number;
}

/**
 * A bounded, expiring, least-recently-used cache held in memory.
 *
 * Model calls are the slowest and most expensive thing the server does, and the
 * same description is often submitted twice (a double click, a retry after a
 * network blip). Map iteration order is insertion order, so re-inserting on read
 * makes the first key the least recently used one.
 */
export function createTtlCache<V>(
  maxEntries: number,
  ttlMs: number,
  now: () => number = Date.now,
): TtlCache<V> {
  const entries = new Map<string, Entry<V>>();
  return {
    get(key) {
      const entry = entries.get(key);
      if (entry === undefined) {
        return undefined;
      }
      entries.delete(key);
      if (entry.expiresAt <= now()) {
        return undefined;
      }
      entries.set(key, entry);
      return entry.value;
    },
    set(key, value) {
      entries.delete(key);
      if (entries.size >= maxEntries) {
        const oldest = entries.keys().next();
        if (oldest.done !== true) {
          entries.delete(oldest.value);
        }
      }
      entries.set(key, { value, expiresAt: now() + ttlMs });
    },
    get size() {
      return entries.size;
    },
  };
}

/** A fixed-length key that never stores the user's text in memory as-is. */
export const cacheKey = (...parts: readonly unknown[]): string =>
  createHash('sha256').update(JSON.stringify(parts)).digest('base64url');
