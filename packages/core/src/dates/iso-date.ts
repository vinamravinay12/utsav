const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const MS_PER_DAY = 86_400_000;

/**
 * Calendar-day arithmetic in UTC.
 *
 * Working in UTC midnight means a daylight-saving shift or the host's time zone
 * can never move a due date by a day. The caller decides what "today" is.
 */
function toEpochDay(date: string): number | undefined {
  const match = ISO_DATE.exec(date);
  if (match === null) {
    return undefined;
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const epoch = Date.UTC(year, month - 1, day);
  // Date.UTC rolls 2026-02-30 over to March; a round trip catches it.
  const roundTrip = new Date(epoch);
  return roundTrip.getUTCMonth() === month - 1 && roundTrip.getUTCDate() === day
    ? epoch / MS_PER_DAY
    : undefined;
}

/** Whether the string is a real calendar date in YYYY-MM-DD form. */
export function isIsoDate(value: string): boolean {
  return toEpochDay(value) !== undefined;
}

function requireEpochDay(date: string): number {
  const epochDay = toEpochDay(date);
  if (epochDay === undefined) {
    throw new RangeError(`Not a calendar date: ${date}`);
  }
  return epochDay;
}

const fromEpochDay = (epochDay: number): string =>
  new Date(epochDay * MS_PER_DAY).toISOString().slice(0, 10);

/** The date a number of days later (or earlier, if negative). */
export function addDays(date: string, days: number): string {
  return fromEpochDay(requireEpochDay(date) + days);
}

/** Whole days from `from` to `to`; negative when `to` is earlier. */
export function daysBetween(from: string, to: string): number {
  return requireEpochDay(to) - requireEpochDay(from);
}

/** 1 = January … 12 = December. */
export function monthOf(date: string): number {
  requireEpochDay(date);
  return Number(date.slice(5, 7));
}

/** 0 = Sunday … 6 = Saturday. */
export function weekdayOf(date: string): number {
  return new Date(requireEpochDay(date) * MS_PER_DAY).getUTCDay();
}

/** The later of two ISO dates (they sort as strings). */
export const laterOf = (a: string, b: string): string => (a >= b ? a : b);
