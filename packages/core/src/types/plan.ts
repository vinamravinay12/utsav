import type { EventBrief } from './brief.js';
import type { CostTier, PhaseId, Severity } from './catalog.js';

export type BudgetTier = 'lean' | 'moderate' | 'premium';

export type LeadStatus = 'comfortable' | 'tight' | 'rushed';

export interface BudgetLine {
  readonly categoryId: string;
  readonly label: string;
  readonly amount: number;
  readonly shareBp: number;
  readonly prioritised: boolean;
  readonly isContingency: boolean;
}

export interface BudgetFinding {
  readonly categoryId: string;
  readonly label: string;
  readonly perGuest: number;
  readonly minPerGuest: number;
  /** Guests the current allocation can serve at the minimum. */
  readonly affordableGuests: number;
  /** Total budget that would lift this category to its minimum, all else equal. */
  readonly budgetNeeded: number;
}

export interface BudgetPlan {
  readonly total: number;
  readonly perGuest: number;
  readonly tier: BudgetTier;
  readonly lines: readonly BudgetLine[];
  readonly findings: readonly BudgetFinding[];
}

export type TaskTiming = 'on-track' | 'compressed' | 'at-risk';

export interface ScheduledTask {
  readonly id: string;
  readonly title: string;
  readonly detail: string;
  readonly category: string;
  readonly dueDate: string;
  readonly daysBefore: number;
  readonly phase: PhaseId;
  readonly timing: TaskTiming;
  readonly essential: boolean;
}

export interface VendorItem {
  readonly id: string;
  readonly label: string;
  readonly category: string;
  readonly bookBy: string;
  readonly timing: TaskTiming;
  readonly estimatedCost: number;
  readonly estimatedDeposit: number;
  readonly questions: readonly string[];
  readonly contractChecks: readonly string[];
}

export interface RankedIdea {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly category: string;
  readonly costTier: CostTier;
  readonly score: number;
  /** Plain-language reasons this idea was picked for this brief. */
  readonly reasons: readonly string[];
}

export interface Insight {
  readonly id: string;
  readonly severity: Severity;
  readonly title: string;
  readonly detail: string;
}

export interface EventPlan {
  readonly brief: EventBrief;
  readonly eventLabel: string;
  /** The day the schedule was anchored to. Progress is judged against later days. */
  readonly plannedOn: string;
  readonly daysUntilEvent: number;
  readonly leadStatus: LeadStatus;
  readonly budget: BudgetPlan;
  readonly tasks: readonly ScheduledTask[];
  readonly vendors: readonly VendorItem[];
  readonly ideas: readonly RankedIdea[];
  readonly insights: readonly Insight[];
}
