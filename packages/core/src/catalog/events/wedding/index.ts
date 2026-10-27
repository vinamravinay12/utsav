import type { EventTemplate } from '../../../types/index.js';
import { weddingBudget } from './budget.js';
import { weddingTasks } from './tasks.js';
import { weddingVendors } from './vendors.js';
import { weddingIdeas } from './ideas.js';

/**
 * Indian wedding planning knowledge.
 *
 * Shares reflect typical spend for a mid-size Indian wedding, where catering and
 * venue (often sold together per plate) take roughly half. The per-plate floor is
 * the lowest rate at which a full wedding meal is realistically catered.
 */
export const wedding: EventTemplate = {
  id: 'wedding',
  title: 'Wedding',
  summary: 'Ceremonies, reception and everything between — for both families.',
  examplePrompt:
    "My sister's wedding in Jaipur on 14 February next year, about 250 guests, budget around 18 lakh. She loves pastel florals and wants it eco-friendly, mostly vegetarian with a Jain counter.",
  minLeadDays: 60,
  idealLeadDays: 300,
  tiers: { moderate: 2500, premium: 6000 },
  budget: weddingBudget,
  tasks: weddingTasks,
  vendors: weddingVendors,
  ideas: weddingIdeas,
};
