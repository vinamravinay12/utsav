import { describe, expect, it } from 'vitest';
import { cacheKey, createTtlCache } from './ttl-cache.js';

describe('createTtlCache', () => {
  it('returns stored values until they expire', () => {
    let clock = 0;
    const cache = createTtlCache<string>(10, 1000, () => clock);
    cache.set('a', 'one');
    expect(cache.get('a')).toBe('one');
    clock = 1000;
    expect(cache.get('a')).toBeUndefined();
    expect(cache.size).toBe(0);
  });

  it('evicts the least recently used entry when full', () => {
    const cache = createTtlCache<number>(2, 1000, () => 0);
    cache.set('a', 1);
    cache.set('b', 2);
    expect(cache.get('a')).toBe(1);
    cache.set('c', 3);
    expect(cache.get('b')).toBeUndefined();
    expect(cache.get('a')).toBe(1);
    expect(cache.get('c')).toBe(3);
  });

  it('replaces a key without evicting another', () => {
    const cache = createTtlCache<number>(2, 1000, () => 0);
    cache.set('a', 1);
    cache.set('b', 2);
    cache.set('a', 10);
    expect(cache.get('a')).toBe(10);
    expect(cache.get('b')).toBe(2);
  });

  it('tolerates a zero-size cache', () => {
    const cache = createTtlCache<number>(0, 1000);
    cache.set('a', 1);
    expect(cache.size).toBe(1);
  });
});

describe('cacheKey', () => {
  it('is stable, fixed-length and does not contain the input', () => {
    const key = cacheKey('extract', 'my sister’s wedding', '2026-10-26');
    expect(key).toBe(cacheKey('extract', 'my sister’s wedding', '2026-10-26'));
    expect(key).not.toBe(cacheKey('extract', 'my sister’s wedding', '2026-10-27'));
    expect(key).toHaveLength(43);
    expect(key).not.toContain('wedding');
  });
});
