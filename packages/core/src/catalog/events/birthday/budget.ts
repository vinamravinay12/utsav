import type { BudgetCategorySpec } from '../../../types/index.js';

/** Birthday: budget categories and their default shares, in basis points. */
export const birthdayBudget: readonly BudgetCategorySpec[] = [
  { id: 'venue', label: 'Venue', shareBp: 2000 },
  { id: 'catering', label: 'Food & drinks', shareBp: 3000, minPerGuest: 250 },
  { id: 'cake', label: 'Cake & desserts', shareBp: 800 },
  { id: 'decor', label: 'Decorations', shareBp: 1200 },
  { id: 'entertainment', label: 'Entertainment', shareBp: 1200 },
  { id: 'photography', label: 'Photos', shareBp: 600 },
  { id: 'favours', label: 'Return gifts', shareBp: 400 },
  { id: 'invitations', label: 'Invitations', shareBp: 200 },
  { id: 'contingency', label: 'Contingency reserve', shareBp: 600, isContingency: true },
];
