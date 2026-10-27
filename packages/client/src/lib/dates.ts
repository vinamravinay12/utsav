/** 5 → "05", for month and day parts. */
const twoDigits = (value: number): string => String(value).padStart(2, '0');

/** The host's calendar day, in their own time zone, as YYYY-MM-DD. */
export function todayIso(now: Date = new Date()): string {
  return `${String(now.getFullYear())}-${twoDigits(now.getMonth() + 1)}-${twoDigits(now.getDate())}`;
}

const DISPLAY = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});

const WITH_WEEKDAY = new Intl.DateTimeFormat('en-IN', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

/** 14 Feb 2027. Dates are calendar days, so they are formatted in UTC. */
export const formatDate = (iso: string): string => DISPLAY.format(new Date(`${iso}T00:00:00Z`));

/** Sunday, 14 February 2027. */
export const formatLongDate = (iso: string): string =>
  WITH_WEEKDAY.format(new Date(`${iso}T00:00:00Z`));

/** Days until or since the event, in words. */
export function describeCountdown(days: number): string {
  if (days === 0) {
    return 'Today';
  }
  if (days < 0) {
    return `${String(-days)} ${-days === 1 ? 'day' : 'days'} ago`;
  }
  return `${String(days)} ${days === 1 ? 'day' : 'days'} to go`;
}
