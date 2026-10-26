export interface Allocation<T> {
  readonly item: T;
  readonly amount: number;
}

const sum = (values: readonly number[]): number =>
  values.reduce((total, value) => total + value, 0);

/**
 * Splits a whole-number total across weighted items so the parts sum to it exactly.
 *
 * Largest-remainder rounding: each item gets the floor of its exact share, and
 * the units lost to flooring go to the items with the biggest fractional
 * remainders. Ties go to the earlier item, so the result is deterministic.
 */
export function allocateByWeight<T>(
  total: number,
  items: readonly T[],
  weightOf: (item: T) => number,
): Allocation<T>[] {
  const weightSum = sum(items.map(weightOf));
  if (weightSum <= 0 || total <= 0) {
    return items.map((item) => ({ item, amount: 0 }));
  }
  const exactOf = (item: T): number => (total * weightOf(item)) / weightSum;
  const leftover = total - sum(items.map((item) => Math.floor(exactOf(item))));
  const bonus = new Set(
    items
      .map((item, index) => ({ index, remainder: exactOf(item) - Math.floor(exactOf(item)) }))
      .sort((a, b) => b.remainder - a.remainder || a.index - b.index)
      .slice(0, leftover)
      .map(({ index }) => index),
  );
  return items.map((item, index) => ({
    item,
    amount: Math.floor(exactOf(item)) + (bonus.has(index) ? 1 : 0),
  }));
}

const INR = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

/** ₹15,00,000 — Indian digit grouping, no paise. */
export const formatInr = (amount: number): string => INR.format(amount);
