const INR_FORMAT = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

/** ₹15,00,000 — Indian digit grouping, no paise. */
export const formatInr = (amount: number): string => INR_FORMAT.format(amount);
