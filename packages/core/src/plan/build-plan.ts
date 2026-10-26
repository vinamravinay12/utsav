import { allocateBudget } from '../budget/allocate-budget.js';
import { assessFeasibility } from '../budget/assess-feasibility.js';
import { insightRules } from '../catalog/insight-rules.js';
import { findTemplate } from '../catalog/registry.js';
import {
  budgetTierOf,
  derivePlanningContext,
  leadStatusOf,
  perGuestOf,
} from '../context/derive-context.js';
import { daysBetween } from '../dates/iso-date.js';
import { rankIdeas } from '../ideas/rank-ideas.js';
import { evaluateInsights } from '../insights/evaluate-insights.js';
import { scheduleTasks } from '../timeline/schedule-tasks.js';
import type { EventBrief, EventPlan } from '../types/index.js';
import { buildVendorChecklist } from '../vendors/build-vendor-checklist.js';

/**
 * Builds the complete plan for a brief.
 *
 * Pure and deterministic: the same brief and planning date always produce the
 * same plan, with no network, storage or clock access. That is what lets the
 * browser build the plan instantly and the server rebuild it to check the AI.
 */
export function buildPlan(brief: EventBrief, plannedOn: string): EventPlan {
  const template = findTemplate(brief.eventType);
  const daysUntilEvent = daysBetween(plannedOn, brief.eventDate);
  if (daysUntilEvent < 0) {
    throw new RangeError('Cannot plan an event that has already happened');
  }
  const context = derivePlanningContext(brief, template, plannedOn);
  const lines = allocateBudget(brief.totalBudget, template.budget, brief.priorities);
  const perGuest = perGuestOf(brief);
  const tier = budgetTierOf(perGuest, template);
  return {
    brief,
    eventLabel: template.title,
    plannedOn,
    daysUntilEvent,
    leadStatus: leadStatusOf(daysUntilEvent, template),
    budget: {
      total: brief.totalBudget,
      perGuest,
      tier,
      lines,
      findings: assessFeasibility(lines, template.budget, brief.guestCount, brief.totalBudget),
    },
    tasks: scheduleTasks(template, context, brief.eventDate, plannedOn),
    vendors: buildVendorChecklist(template, context, lines, {
      eventDate: brief.eventDate,
      plannedOn,
    }),
    ideas: rankIdeas(template.ideas, brief, tier),
    insights: evaluateInsights(insightRules, context),
  };
}
