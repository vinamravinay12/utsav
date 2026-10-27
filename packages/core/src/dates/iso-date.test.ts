import { describe, expect, it } from 'vitest';
import { addDays, daysBetween, isIsoDate, monthOf, weekdayOf } from './iso-date.js';

describe('iso dates', () => {
  it('accepts real calendar dates only', () => {
    expect(isIsoDate('2026-02-28')).toBe(true);
    expect(isIsoDate('2028-02-29')).toBe(true);
    expect(isIsoDate('2026-02-29')).toBe(false);
    expect(isIsoDate('2026-13-01')).toBe(false);
    expect(isIsoDate('26-01-01')).toBe(false);
    expect(isIsoDate('2026-1-01')).toBe(false);
  });

  it('adds days across month and year boundaries', () => {
    expect(addDays('2026-12-30', 3)).toBe('2027-01-02');
    expect(addDays('2027-03-01', -1)).toBe('2027-02-28');
    expect(addDays('2026-10-26', 0)).toBe('2026-10-26');
  });

  it('counts whole days in either direction', () => {
    expect(daysBetween('2026-10-26', '2027-02-14')).toBe(111);
    expect(daysBetween('2027-02-14', '2026-10-26')).toBe(-111);
    // A DST transition in a host time zone cannot shift a UTC day count.
    expect(daysBetween('2026-03-07', '2026-03-09')).toBe(2);
  });

  it('reads month and weekday', () => {
    expect(monthOf('2027-02-14')).toBe(2);
    expect(weekdayOf('2027-02-14')).toBe(0);
    expect(weekdayOf('2026-10-31')).toBe(6);
  });

  it('throws on a malformed date rather than computing nonsense', () => {
    expect(() => addDays('2026-02-30', 1)).toThrow(RangeError);
    expect(() => monthOf('not a date')).toThrow(RangeError);
  });
});
