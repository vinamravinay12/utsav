/** The planning date every profile uses, so runs are comparable. */
export const PLANNED_ON = '2026-10-26';

/** The value at a percentile (0–100) of an ascending list of samples. */
export const percentile = (sorted, rank) =>
  sorted[Math.min(sorted.length - 1, Math.floor((rank / 100) * sorted.length))];
