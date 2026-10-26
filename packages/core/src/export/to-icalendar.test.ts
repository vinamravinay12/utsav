import { describe, expect, it } from 'vitest';
import { buildPlan } from '../plan/build-plan.js';
import { PLANNED_ON, weddingBrief } from '../test-utils/briefs.js';
import { escapeText, foldLine, toICalendar, utf8Length } from './to-icalendar.js';

const plan = buildPlan(weddingBrief, PLANNED_ON);

describe('escapeText', () => {
  it('escapes the characters RFC 5545 reserves', () => {
    expect(escapeText('a\\b;c,d\ne')).toBe(String.raw`a\\b\;c\,d\ne`);
  });
});

describe('utf8Length', () => {
  it('counts bytes, not characters', () => {
    expect(utf8Length('a')).toBe(1);
    expect(utf8Length('é')).toBe(2);
    expect(utf8Length('₹')).toBe(3);
    expect(utf8Length('🎉')).toBe(4);
  });
});

describe('foldLine', () => {
  it('leaves short lines alone', () => {
    expect(foldLine('SUMMARY:short')).toBe('SUMMARY:short');
  });

  it('folds long lines at 75 octets without splitting a character', () => {
    const folded = foldLine(`DESCRIPTION:${'₹'.repeat(60)}`);
    const parts = folded.split('\r\n ');
    expect(parts.length).toBeGreaterThan(1);
    expect(parts.every((part) => utf8Length(part) <= 75)).toBe(true);
    expect(parts.join('')).toBe(`DESCRIPTION:${'₹'.repeat(60)}`);
  });
});

describe('toICalendar', () => {
  const calendar = toICalendar(plan);

  it('produces a well-formed calendar with CRLF line endings', () => {
    expect(calendar.startsWith('BEGIN:VCALENDAR\r\nVERSION:2.0\r\n')).toBe(true);
    expect(calendar.endsWith('END:VCALENDAR\r\n')).toBe(true);
    expect(calendar.replace(/\r\n/g, '')).not.toContain('\n');
  });

  it('adds the event day plus one entry per task, each stamped', () => {
    const events = calendar.match(/BEGIN:VEVENT/g) ?? [];
    expect(events).toHaveLength(plan.tasks.length + 1);
    expect(calendar.match(/DTSTAMP:20261026T000000Z/g)).toHaveLength(plan.tasks.length + 1);
    expect(calendar).toContain('DTSTART;VALUE=DATE:20270214');
    expect(calendar).toContain('UID:w-venue@utsav.planner');
  });

  it('can export only the tasks still to do', () => {
    const pending = toICalendar(plan, new Set(['w-venue']));
    expect(pending.match(/BEGIN:VEVENT/g)).toHaveLength(2);
  });
});
