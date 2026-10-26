import type { InsightRule } from '../types/index.js';
import { CHILDREN, OLDER_GUESTS, OPEN_AIR, SUSTAINABLE } from './common-conditions.js';

/**
 * Planning advice that depends on the combination of facts in a brief.
 *
 * Each rule is data: a condition over the planning context and a message. The
 * engine evaluates all of them and shows the ones that hold, most severe first.
 */
export const insightRules: readonly InsightRule[] = [
  {
    id: 'lead-rushed',
    severity: 'critical',
    title: 'Very little time',
    detail:
      'Only {daysUntilEvent} days to go, under the {minLeadDays}-day minimum for a {eventLabel}. Book the essentials this week and prefer package vendors who bundle services.',
    when: { field: 'leadStatus', equals: 'rushed' },
  },
  {
    id: 'lead-tight',
    severity: 'warning',
    title: 'Compressed timeline',
    detail:
      '{daysUntilEvent} days is less than half the usual {idealLeadDays}-day runway, so tasks have been pulled forward. Work through the essential ones first.',
    when: { field: 'leadStatus', equals: 'tight' },
  },
  {
    id: 'monsoon-open-air',
    severity: 'critical',
    title: 'Monsoon date with an open-air setting',
    detail:
      'Heavy rain is likely in month {month}. Budget for waterproof tenting, raised flooring and a covered fallback before anything decorative.',
    when: { all: [{ field: 'season', equals: 'monsoon' }, OPEN_AIR] },
  },
  {
    id: 'summer-open-air',
    severity: 'warning',
    title: 'Summer heat outdoors',
    detail:
      'Plan for shade, water stations and an evening start time; heat exhaustion is the most common summer event emergency.',
    when: { all: [{ field: 'season', equals: 'summer' }, OPEN_AIR] },
  },
  {
    id: 'peak-wedding-season',
    severity: 'warning',
    title: 'Peak wedding season',
    detail:
      'November to February is when venues, decorators and photographers book out first and charge more. Lock the venue and caterer before anything else.',
    when: {
      all: [
        { field: 'eventType', equals: 'wedding' },
        { field: 'peakWeddingSeason', equals: true },
      ],
    },
  },
  {
    id: 'festive-community',
    severity: 'warning',
    title: 'Festival season demand',
    detail:
      'October and November are full of festivals: sound, tents and police permissions are in heavy demand. Apply and book earlier than the timeline suggests.',
    when: {
      all: [
        { field: 'eventType', equals: 'community' },
        { field: 'season', equals: 'festive' },
      ],
    },
  },
  {
    id: 'weekend-large',
    severity: 'info',
    title: 'Large weekend event',
    detail:
      'Weekend dates go first. Ask venues about a Friday or Sunday-evening rate if prices are high.',
    when: {
      all: [
        { field: 'weekend', equals: true },
        { field: 'guestCount', atLeast: 150 },
      ],
    },
  },
  {
    id: 'large-crowd',
    severity: 'warning',
    title: 'Crowd of {guestCount}',
    detail:
      'At this size you need marked exits, parking or drop-off management and a named safety lead on the day.',
    when: { field: 'guestCount', atLeast: 300 },
  },
  {
    id: 'children-safety',
    severity: 'info',
    title: 'Children’s safety',
    detail:
      'Keep one adult for every eight children, collect allergies on the RSVP and keep a first-aid kit in reach.',
    when: CHILDREN,
  },
  {
    id: 'older-guests',
    severity: 'info',
    title: 'Comfort for older guests',
    detail:
      'Step-free access, chairs with backs, a quiet corner and food served early help elders enjoy the day.',
    when: OLDER_GUESTS,
  },
  {
    id: 'many-diets',
    severity: 'info',
    title: '{dietaryCount} dietary needs to cater for',
    detail:
      'Label every dish, keep separate serving counters and brief the serving staff on what each label means.',
    when: { field: 'dietaryCount', atLeast: 2 },
  },
  {
    id: 'sustainable',
    severity: 'info',
    title: 'Low-waste event',
    detail:
      'Ask every vendor for reusable or compostable options, segregate waste on site and arrange surplus-food donation.',
    when: SUSTAINABLE,
  },
  {
    id: 'lean-budget',
    severity: 'info',
    title: 'Lean budget per guest',
    detail:
      '₹{budgetPerGuest} per guest is tight for a {eventLabel}. Ideas are limited to low-cost options; trimming the guest list stretches every category.',
    when: { field: 'budgetTier', equals: 'lean' },
  },
];
