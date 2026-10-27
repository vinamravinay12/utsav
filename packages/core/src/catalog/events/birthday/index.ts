import type { EventTemplate } from '../../../types/index.js';
import { birthdayBudget } from './budget.js';
import { birthdayTasks } from './tasks.js';
import { birthdayVendors } from './vendors.js';
import { birthdayIdeas } from './ideas.js';

/**
 * Birthday party planning knowledge, from a child's party at home to a
 * milestone dinner. Children's parties add supervision and allergy checks.
 */
export const birthday: EventTemplate = {
  id: 'birthday',
  title: 'Birthday',
  summary: 'From a backyard kids’ party to a milestone dinner.',
  examplePrompt:
    'Surprise 60th birthday for my dad in Pune on the 20th of next month. Around 40 family and friends, budget ₹80,000, indoors. He loves old Hindi songs and good food; some guests are diabetic and two are vegan.',
  minLeadDays: 5,
  idealLeadDays: 45,
  tiers: { moderate: 1000, premium: 3000 },
  budget: birthdayBudget,
  tasks: birthdayTasks,
  vendors: birthdayVendors,
  ideas: birthdayIdeas,
};
