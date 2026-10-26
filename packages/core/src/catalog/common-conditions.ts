import type { Condition } from '../types/index.js';

/** Conditions shared across templates, named for what they mean to a planner. */
export const OPEN_AIR: Condition = { field: 'setting', oneOf: ['outdoor', 'mixed'] };

export const CHILDREN: Condition = { field: 'ageGroup', equals: 'kids' };

export const OLDER_GUESTS: Condition = { field: 'ageGroup', oneOf: ['seniors', 'all-ages'] };

export const SUSTAINABLE: Condition = {
  any: [
    { field: 'style', equals: 'eco' },
    { field: 'interests', has: 'sustainability' },
  ],
};

export const guestsAtLeast = (count: number): Condition => ({
  field: 'guestCount',
  atLeast: count,
});
