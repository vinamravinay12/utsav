import { addDays } from '../dates/iso-date.js';
import type { EventPlan } from '../types/index.js';

const MAX_LINE_OCTETS = 75;

/** RFC 5545 §3.3.11: backslash, semicolon, comma and newlines are escaped in TEXT. */
export function escapeText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

/** Bytes a string occupies in UTF-8, without depending on a host encoder. */
export function utf8Length(text: string): number {
  let bytes = 0;
  for (let index = 0; index < text.length; index += 1) {
    const unit = text.charCodeAt(index);
    if (unit < 0x80) {
      bytes += 1;
    } else if (unit < 0x800) {
      bytes += 2;
    } else if (unit >= 0xd800 && unit <= 0xdbff) {
      // A high surrogate and the low one after it encode a single 4-byte character.
      bytes += 4;
      index += 1;
    } else {
      bytes += 3;
    }
  }
  return bytes;
}

/**
 * RFC 5545 §3.1: lines longer than 75 octets are folded with CRLF and a space.
 * Folding counts UTF-8 bytes and never splits a multi-byte character.
 */
export function foldLine(line: string): string {
  // Most lines need no folding; checking first skips the per-character walk.
  if (utf8Length(line) <= MAX_LINE_OCTETS) {
    return line;
  }
  const parts: string[] = [];
  let current = '';
  let currentBytes = 0;
  for (const character of line) {
    // Continuation lines start with a space, which takes one of their 75 octets.
    const limit = parts.length === 0 ? MAX_LINE_OCTETS : MAX_LINE_OCTETS - 1;
    const bytes = utf8Length(character);
    if (currentBytes + bytes > limit) {
      parts.push(current);
      current = character;
      currentBytes = bytes;
    } else {
      current += character;
      currentBytes += bytes;
    }
  }
  parts.push(current);
  return parts.join('\r\n ');
}

const compact = (isoDate: string): string => isoDate.replace(/-/g, '');

function allDayEvent(uid: string, date: string, summary: string, description: string): string[] {
  return [
    'BEGIN:VEVENT',
    `UID:${uid}@utsav.planner`,
    `DTSTART;VALUE=DATE:${compact(date)}`,
    `DTEND;VALUE=DATE:${compact(addDays(date, 1))}`,
    `SUMMARY:${escapeText(summary)}`,
    `DESCRIPTION:${escapeText(description)}`,
    'END:VEVENT',
  ];
}

/**
 * The plan's timeline as an iCalendar file, so every task lands in the host's
 * own calendar with its due date. DTSTAMP is the planning date, not the clock,
 * which keeps the export deterministic.
 */
export function toICalendar(
  plan: EventPlan,
  pendingOnly: ReadonlySet<string> | null = null,
): string {
  const tasks =
    pendingOnly === null ? plan.tasks : plan.tasks.filter((task) => pendingOnly.has(task.id));
  const stamp = `DTSTAMP:${compact(plan.plannedOn)}T000000Z`;
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Utsav//Event Planner//EN',
    'CALSCALE:GREGORIAN',
    `X-WR-CALNAME:${escapeText(plan.brief.name)}`,
    ...allDayEvent(
      'event-day',
      plan.brief.eventDate,
      plan.brief.name,
      `${plan.eventLabel} in ${plan.brief.city}`,
    ),
    ...tasks.flatMap((task) => allDayEvent(task.id, task.dueDate, task.title, task.detail)),
    'END:VCALENDAR',
  ];
  const withStamp = lines.flatMap((line) => (line.startsWith('UID:') ? [line, stamp] : [line]));
  return `${withStamp.map(foldLine).join('\r\n')}\r\n`;
}
