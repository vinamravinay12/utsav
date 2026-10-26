import { describe, expect, it } from 'vitest';
import { resolveToday } from './resolve-today.js';

const now = new Date('2026-10-26T20:00:00Z');

describe('resolveToday', () => {
  it('trusts the browser’s date within a day of the server’s', () => {
    expect(resolveToday('2026-10-27', now)).toBe('2026-10-27');
    expect(resolveToday('2026-10-25', now)).toBe('2026-10-25');
  });

  it('uses the server’s date for a clock that is far off or invalid', () => {
    expect(resolveToday('2020-01-01', now)).toBe('2026-10-26');
    expect(resolveToday('2026-02-30', now)).toBe('2026-10-26');
  });
});
