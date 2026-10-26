import type { EventBrief } from '../types/index.js';

export const PLANNED_ON = '2026-10-26';

/** A well-funded eco wedding with plenty of guests and a little under four months to go. */
export const weddingBrief: EventBrief = {
  eventType: 'wedding',
  name: 'Asha & Rohan',
  eventDate: '2027-02-14',
  guestCount: 250,
  totalBudget: 1_800_000,
  city: 'Jaipur',
  setting: 'mixed',
  style: 'eco',
  ageGroup: 'all-ages',
  priorities: ['decor', 'photography'],
  interests: ['sustainability', 'food'],
  dietary: ['vegetarian', 'jain'],
};

/** A small children's party in four days on a shoestring. */
export const kidsBirthdayBrief: EventBrief = {
  eventType: 'birthday',
  name: 'Kabir turns 7',
  eventDate: '2026-10-30',
  guestCount: 20,
  totalBudget: 15_000,
  city: 'Pune',
  setting: 'outdoor',
  style: 'modern',
  ageGroup: 'kids',
  priorities: [],
  interests: ['games'],
  dietary: ['nut-free'],
};

/** A large open-air neighbourhood fair in the monsoon. */
export const communityBrief: EventBrief = {
  eventType: 'community',
  name: 'Green Park fair',
  eventDate: '2027-07-18',
  guestCount: 400,
  totalBudget: 150_000,
  city: 'Bengaluru',
  setting: 'outdoor',
  style: 'eco',
  ageGroup: 'all-ages',
  priorities: ['safety'],
  interests: ['food', 'games', 'sustainability'],
  dietary: [],
};
