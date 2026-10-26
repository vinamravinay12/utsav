import type { AgeGroup, EventTypeId, InterestId, Setting, StyleId } from './brief.js';
import type { Condition } from './condition.js';

export interface BudgetCategorySpec {
  readonly id: string;
  readonly label: string;
  /** Share of the total budget in basis points; a template's shares sum to 10 000. */
  readonly shareBp: number;
  /** Rupees per guest below which this category cannot realistically be delivered. */
  readonly minPerGuest?: number;
  /** Exactly one category per template is the reserve for overruns. */
  readonly isContingency?: true;
}

export type PhaseId =
  'foundations' | 'bookings' | 'details' | 'final-weeks' | 'event-week' | 'after';

export interface TaskSpec {
  readonly id: string;
  readonly title: string;
  readonly detail: string;
  /** Budget category the task spends from, or `planning` for non-spending work. */
  readonly category: string;
  /** Ideal days before the event. Negative means after it. */
  readonly idealDaysBefore: number;
  /** Latest the task can still happen and work, in days before the event. */
  readonly latestDaysBefore: number;
  readonly essential: boolean;
  readonly when?: Condition;
}

export interface VendorSpec {
  readonly id: string;
  readonly label: string;
  readonly category: string;
  /** Ideal booking lead, in days before the event. */
  readonly bookDaysBefore: number;
  /** Fraction of the category budget this vendor typically takes. */
  readonly categoryShare: number;
  /** Typical advance asked at booking, as a fraction of the vendor's fee. */
  readonly depositShare: number;
  readonly questions: readonly string[];
  readonly contractChecks: readonly string[];
  readonly when?: Condition;
}

export type CostTier = 'low' | 'mid' | 'high';

export interface IdeaSpec {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly category: string;
  readonly costTier: CostTier;
  readonly styles: readonly StyleId[];
  readonly interests: readonly InterestId[];
  /** Settings the idea physically works in. Empty means any. */
  readonly settings: readonly Setting[];
  /** Audiences the idea suits. Empty means any. */
  readonly ageGroups: readonly AgeGroup[];
}

export interface BudgetTierThresholds {
  /** Rupees per guest at which mid-cost ideas become affordable. */
  readonly moderate: number;
  /** Rupees per guest at which high-cost ideas become affordable. */
  readonly premium: number;
}

export interface EventTemplate {
  readonly id: EventTypeId;
  readonly title: string;
  readonly summary: string;
  readonly examplePrompt: string;
  /** Below this many days the event is at real risk of not coming together. */
  readonly minLeadDays: number;
  /** Comfortable planning horizon; the task offsets are written against it. */
  readonly idealLeadDays: number;
  readonly tiers: BudgetTierThresholds;
  readonly budget: readonly BudgetCategorySpec[];
  readonly tasks: readonly TaskSpec[];
  readonly vendors: readonly VendorSpec[];
  readonly ideas: readonly IdeaSpec[];
}

export type Severity = 'critical' | 'warning' | 'info';

export interface InsightRule {
  readonly id: string;
  readonly severity: Severity;
  readonly title: string;
  /** May reference context fields as `{fieldName}`. */
  readonly detail: string;
  readonly when: Condition;
}
