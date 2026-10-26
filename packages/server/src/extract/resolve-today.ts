import { daysBetween, isIsoDate } from '@utsav/core';

/**
 * The browser's idea of "today" is used — it is the host's calendar day — but
 * only within a day of the server's, which covers every time zone. Anything
 * further off is a broken or tampered clock, and the server's date wins.
 */
export function resolveToday(claimed: string, now: Date): string {
  const serverToday = now.toISOString().slice(0, 10);
  return isIsoDate(claimed) && Math.abs(daysBetween(serverToday, claimed)) <= 1
    ? claimed
    : serverToday;
}
