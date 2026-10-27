import type { PhaseId, Severity, SpendStatus, TaskTiming, VendorStatus } from '@utsav/core';
import type { Tone } from '../ui/Badge.js';

/** How each timeline phase is titled. */
export const PHASE_LABELS: Readonly<Record<PhaseId, string>> = {
  foundations: 'Six months or more before',
  bookings: 'Three to six months before',
  details: 'One to three months before',
  'final-weeks': 'The final month',
  'event-week': 'Event week',
  after: 'After the event',
};

/** Phases in the order they happen. */
export const PHASE_ORDER: readonly PhaseId[] = [
  'foundations',
  'bookings',
  'details',
  'final-weeks',
  'event-week',
  'after',
];

/** Label and badge tone for each task or vendor timing. */
export const TIMING: Readonly<Record<TaskTiming, readonly [string, Tone]>> = {
  'on-track': ['On schedule', 'ok'],
  compressed: ['Pulled forward', 'warn'],
  'at-risk': ['At risk — do now', 'danger'],
};

/** Label and badge tone for each insight severity. */
export const SEVERITY: Readonly<Record<Severity, readonly [string, Tone]>> = {
  critical: ['Critical', 'danger'],
  warning: ['Heads up', 'warn'],
  info: ['Tip', 'info'],
};

/** Label and badge tone for each spending status. */
export const SPEND: Readonly<Record<SpendStatus, readonly [string, Tone]>> = {
  unspent: ['Not started', 'neutral'],
  'on-track': ['On budget', 'ok'],
  'near-limit': ['Near limit', 'warn'],
  over: ['Over budget', 'danger'],
};

/** How each vendor status reads in the status picker. */
export const VENDOR_STATUS_LABELS: Readonly<Record<VendorStatus, string>> = {
  todo: 'Not contacted',
  contacted: 'Contacted',
  quoted: 'Quote received',
  booked: 'Booked',
};

/** How each idea cost tier reads on its badge. */
export const COST_TIER_LABELS = { low: 'Low cost', mid: 'Mid cost', high: 'Premium' } as const;
