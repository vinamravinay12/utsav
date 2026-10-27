import { applies } from '../conditions/evaluate-condition.js';
import { addDays, daysBetween } from '../dates/iso-date.js';
import type {
  EventTemplate,
  PhaseId,
  PlanningContext,
  ScheduledTask,
  TaskSpec,
  TaskTiming,
} from '../types/index.js';

/** Upper bounds, in days before the event, of each phase. Checked in order. */
const PHASE_BOUNDS: readonly (readonly [PhaseId, number])[] = [
  ['after', -1],
  ['event-week', 7],
  ['final-weeks', 30],
  ['details', 90],
  ['bookings', 180],
];

/** The timeline phase a task falls in, from how many days before the event it is due. */
export const phaseOf = (daysBefore: number): PhaseId =>
  PHASE_BOUNDS.find(([, bound]) => daysBefore <= bound)?.[0] ?? 'foundations';

interface Placement {
  readonly daysBefore: number;
  readonly timing: TaskTiming;
}

/**
 * Maps an ideal offset onto the time actually left, preserving order.
 *
 * The final half of the remaining time is kept at real scale — the last weeks
 * before an event are not negotiable — and everything that ideally happens
 * earlier is squeezed proportionally into the first half. The mapping is
 * continuous and increasing, so no task jumps ahead of one that should follow it.
 */
export function compressOffset(
  ideal: number,
  daysUntilEvent: number,
  idealLeadDays: number,
): number {
  const knee = daysUntilEvent / 2;
  if (daysUntilEvent >= idealLeadDays || ideal <= knee) {
    return ideal;
  }
  return Math.round(knee + ((ideal - knee) * (daysUntilEvent - knee)) / (idealLeadDays - knee));
}

/**
 * Decides when a task should happen given how much time is actually left.
 *
 * - Enough runway: the task sits at its ideal offset.
 * - Too little for the ideal, but its latest workable point is still ahead:
 *   the offset is compressed, but never past the latest point.
 * - Even the latest point has passed: the task is due now and flagged at risk.
 */
export function placeTask(
  spec: Pick<TaskSpec, 'idealDaysBefore' | 'latestDaysBefore'>,
  daysUntilEvent: number,
  idealLeadDays: number,
): Placement {
  const compressed = compressOffset(spec.idealDaysBefore, daysUntilEvent, idealLeadDays);
  if (compressed === spec.idealDaysBefore) {
    return { daysBefore: compressed, timing: 'on-track' };
  }
  if (spec.latestDaysBefore > daysUntilEvent) {
    return { daysBefore: daysUntilEvent, timing: 'at-risk' };
  }
  return { daysBefore: Math.max(spec.latestDaysBefore, compressed), timing: 'compressed' };
}

/** Earliest due first; on the same day, essential tasks before optional ones. */
const byDueDate = (first: ScheduledTask, second: ScheduledTask): number =>
  first.dueDate.localeCompare(second.dueDate) || Number(second.essential) - Number(first.essential);

/** The applicable tasks for this brief, each with a concrete due date, in the order to do them. */
export function scheduleTasks(
  template: EventTemplate,
  context: PlanningContext,
  eventDate: string,
  plannedOn: string,
): ScheduledTask[] {
  const daysUntilEvent = daysBetween(plannedOn, eventDate);
  return template.tasks
    .filter((spec) => applies(spec.when, context))
    .map((spec): ScheduledTask => {
      const { daysBefore, timing } = placeTask(spec, daysUntilEvent, template.idealLeadDays);
      return {
        id: spec.id,
        title: spec.title,
        detail: spec.detail,
        category: spec.category,
        dueDate: addDays(eventDate, -daysBefore),
        daysBefore,
        phase: phaseOf(daysBefore),
        timing,
        essential: spec.essential,
      };
    })
    .sort(byDueDate);
}
