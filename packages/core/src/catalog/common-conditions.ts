import type { Condition } from '../types/index.js';

/** Conditions shared across templates, named for what they mean to a planner. */
export const OPEN_AIR: Condition = { field: 'setting', oneOf: ['outdoor', 'mixed'] };

/** A children’s event. */
export const CHILDREN: Condition = { field: 'ageGroup', equals: 'kids' };

/** Elders are among the guests. */
export const OLDER_GUESTS: Condition = { field: 'ageGroup', oneOf: ['seniors', 'all-ages'] };

/** The host wants a low-waste event, by style or by stated interest. */
export const SUSTAINABLE: Condition = {
  any: [
    { field: 'style', equals: 'eco' },
    { field: 'interests', has: 'sustainability' },
  ],
};

/** At least this many guests. */
export const guestsAtLeast = (count: number): Condition => ({
  field: 'guestCount',
  atLeast: count,
});
