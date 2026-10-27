import type { BudgetCategorySpec } from '../../../types/index.js';

/** Community: budget categories and their default shares, in basis points. */
export const communityBudget: readonly BudgetCategorySpec[] = [
  { id: 'venue', label: 'Venue & permits', shareBp: 1500 },
  { id: 'catering', label: 'Refreshments', shareBp: 1800, minPerGuest: 60 },
  { id: 'production', label: 'Stage, sound & lighting', shareBp: 1500 },
  { id: 'marketing', label: 'Promotion & outreach', shareBp: 1000 },
  { id: 'logistics', label: 'Seating, tents & sanitation', shareBp: 1300 },
  { id: 'safety', label: 'Safety, first aid & insurance', shareBp: 900 },
  { id: 'programme', label: 'Programme & performers', shareBp: 1000 },
  { id: 'volunteers', label: 'Volunteer care', shareBp: 400 },
  { id: 'contingency', label: 'Contingency reserve', shareBp: 600, isContingency: true },
];
