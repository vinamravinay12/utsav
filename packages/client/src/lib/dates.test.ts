import { describe, expect, it } from 'vitest';
import { describeCountdown, formatDate, formatLongDate, todayIso } from './dates.js';

describe('dates', () => {
  it('reads today in the host’s own time zone', () => {
    expect(todayIso(new Date(2026, 0, 5, 23, 30))).toBe('2026-01-05');
  });

  it('formats calendar days without shifting them by time zone', () => {
    expect(formatDate('2027-02-14')).toBe('14 Feb 2027');
    expect(formatLongDate('2027-02-14')).toBe('Sunday, 14 February 2027');
  });

  it('describes the countdown in words', () => {
    expect(describeCountdown(0)).toBe('Today');
    expect(describeCountdown(1)).toBe('1 day to go');
    expect(describeCountdown(111)).toBe('111 days to go');
    expect(describeCountdown(-1)).toBe('1 day ago');
    expect(describeCountdown(-3)).toBe('3 days ago');
  });
});
