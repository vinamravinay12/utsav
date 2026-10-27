import type { BudgetCategorySpec } from '../../../types/index.js';

/** Wedding: budget categories and their default shares, in basis points. */
export const weddingBudget: readonly BudgetCategorySpec[] = [
  { id: 'venue', label: 'Venue', shareBp: 2000, minPerGuest: 300 },
  { id: 'catering', label: 'Catering', shareBp: 2700, minPerGuest: 800 },
  { id: 'decor', label: 'Décor & flowers', shareBp: 1200 },
  { id: 'photography', label: 'Photo & video', shareBp: 900 },
  { id: 'attire', label: 'Attire & beauty', shareBp: 1000 },
  { id: 'entertainment', label: 'Music & entertainment', shareBp: 500 },
  { id: 'invitations', label: 'Invitations & stationery', shareBp: 300 },
  { id: 'favours', label: 'Gifts & favours', shareBp: 200 },
  { id: 'logistics', label: 'Transport & stay', shareBp: 200 },
  { id: 'contingency', label: 'Contingency reserve', shareBp: 1000, isContingency: true },
];
