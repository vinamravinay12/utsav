export type Season = 'winter' | 'summer' | 'monsoon' | 'festive';

/**
 * The Indian planning calendar, indexed January first.
 *
 * Seasons here are about what goes wrong outdoors and when vendors are scarce,
 * not meteorology: June to September is when an open-air event needs a rain
 * plan, and October–November is when festivals book out sound, tents and decor.
 */
const SEASON_BY_MONTH: readonly Season[] = [
  'winter',
  'winter',
  'summer',
  'summer',
  'summer',
  'monsoon',
  'monsoon',
  'monsoon',
  'monsoon',
  'festive',
  'festive',
  'winter',
];

/** November to February: the peak wedding months, when venues go first. */
const PEAK_WEDDING_MONTHS: readonly number[] = [11, 12, 1, 2];

/** The planning season for a month (1–12). */
export const seasonOf = (month: number): Season => SEASON_BY_MONTH[(month - 1) % 12] ?? 'winter';

/** Whether venues and vendors are in peak wedding demand that month. */
export const isPeakWeddingMonth = (month: number): boolean => PEAK_WEDDING_MONTHS.includes(month);
