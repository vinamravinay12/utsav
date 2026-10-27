import { applies } from '../conditions/evaluate-condition.js';
import { addDays, daysBetween } from '../dates/iso-date.js';
import { compressOffset } from '../timeline/schedule-tasks.js';
import type {
  BudgetLine,
  EventTemplate,
  PlanningContext,
  TaskTiming,
  VendorItem,
} from '../types/index.js';

/** When to book a vendor, compressed on the same curve as tasks when time is short. */
function bookingWindow(
  bookDaysBefore: number,
  daysUntilEvent: number,
  template: EventTemplate,
): { daysBefore: number; timing: TaskTiming } {
  const daysBefore = compressOffset(bookDaysBefore, daysUntilEvent, template.idealLeadDays);
  if (daysBefore === bookDaysBefore) {
    return { daysBefore, timing: 'on-track' };
  }
  return { daysBefore, timing: daysUntilEvent < template.minLeadDays ? 'at-risk' : 'compressed' };
}

/**
 * The vendors this event needs, with a book-by date, an expected fee drawn from
 * the category budget, the advance to keep ready, and what to ask and check.
 */
export function buildVendorChecklist(
  template: EventTemplate,
  context: PlanningContext,
  lines: readonly BudgetLine[],
  dates: { readonly eventDate: string; readonly plannedOn: string },
): VendorItem[] {
  const daysUntilEvent = daysBetween(dates.plannedOn, dates.eventDate);
  const amountFor = (category: string): number =>
    lines.find((line) => line.categoryId === category)?.amount ?? 0;
  return template.vendors
    .filter((spec) => applies(spec.when, context))
    .map((spec): VendorItem => {
      const { daysBefore, timing } = bookingWindow(spec.bookDaysBefore, daysUntilEvent, template);
      const estimatedCost = Math.round(amountFor(spec.category) * spec.categoryShare);
      return {
        id: spec.id,
        label: spec.label,
        category: spec.category,
        bookBy: addDays(dates.eventDate, -daysBefore),
        timing,
        estimatedCost,
        estimatedDeposit: Math.round(estimatedCost * spec.depositShare),
        questions: spec.questions,
        contractChecks: spec.contractChecks,
      };
    })
    .sort((first, second) => first.bookBy.localeCompare(second.bookBy));
}
