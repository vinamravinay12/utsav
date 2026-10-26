import { afterEach, describe, expect, it, vi } from 'vitest';
import { describeCause, logEvent } from './log.js';

describe('logEvent', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('writes one JSON object per line with a Cloud Logging severity', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    logEvent('WARNING', 'guard unavailable', { model: 'm' });
    logEvent('INFO', 'plain');
    expect(spy.mock.calls.map(([line]) => JSON.parse(String(line)) as unknown)).toEqual([
      { severity: 'WARNING', message: 'guard unavailable', model: 'm' },
      { severity: 'INFO', message: 'plain' },
    ]);
  });
});

describe('describeCause', () => {
  it('reads error messages, truncated, and stringifies anything else', () => {
    expect(describeCause(new Error('boom'))).toBe('boom');
    expect(describeCause(new Error('x'.repeat(500)))).toHaveLength(300);
    expect(describeCause(42)).toBe('42');
  });
});
