import type { EventTemplate } from '../../../types/index.js';
import { communityBudget } from './budget.js';
import { communityTasks } from './tasks.js';
import { communityVendors } from './vendors.js';
import { communityIdeas } from './ideas.js';

/**
 * Community event planning knowledge: festivals, fairs, fundraisers and drives
 * run by a residents' association, club or volunteer group.
 *
 * Public events in India need police and municipal permission once they draw a
 * crowd or use a public ground, and loudspeakers are restricted after 10 pm, so
 * permits and safety are first-class tasks rather than footnotes.
 */
export const community: EventTemplate = {
  id: 'community',
  title: 'Community event',
  summary: 'Festivals, fairs, fundraisers and drives for a neighbourhood or club.',
  examplePrompt:
    'Our residents’ association wants a Sunday community fair in the society park in Bengaluru about 10 weeks from now. Expecting 400 people, budget ₹1.5 lakh, all ages. We want local food stalls, kids’ games and a zero-waste theme.',
  minLeadDays: 14,
  idealLeadDays: 90,
  tiers: { moderate: 300, premium: 1000 },
  budget: communityBudget,
  tasks: communityTasks,
  vendors: communityVendors,
  ideas: communityIdeas,
};
