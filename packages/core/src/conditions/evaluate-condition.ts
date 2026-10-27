import type { Condition, ContextValue, PlanningContext } from '../types/index.js';

type LeafCondition = Extract<Condition, { readonly field: string }>;

/** The value when it is a number, otherwise undefined. */
const asNumber = (value: ContextValue | undefined): number | undefined =>
  typeof value === 'number' ? value : undefined;

/** Evaluates a single comparison against one context field. */
function evaluateLeaf(condition: LeafCondition, context: PlanningContext): boolean {
  const fieldValue = context[condition.field];
  if ('equals' in condition) {
    return fieldValue === condition.equals;
  }
  if ('oneOf' in condition) {
    return typeof fieldValue === 'string' && condition.oneOf.includes(fieldValue);
  }
  if ('has' in condition) {
    return Array.isArray(fieldValue) && fieldValue.includes(condition.has);
  }
  const number = asNumber(fieldValue);
  if (number === undefined) {
    return false;
  }
  return 'atLeast' in condition ? number >= condition.atLeast : number < condition.below;
}

/**
 * Evaluates a declarative condition.
 *
 * A missing field is false rather than an error: a rule that cannot be decided
 * for this brief simply does not apply to it.
 */
export function evaluateCondition(condition: Condition, context: PlanningContext): boolean {
  if ('all' in condition) {
    return condition.all.every((part) => evaluateCondition(part, context));
  }
  if ('any' in condition) {
    return condition.any.some((part) => evaluateCondition(part, context));
  }
  if ('not' in condition) {
    return !evaluateCondition(condition.not, context);
  }
  return evaluateLeaf(condition, context);
}

/** Absent conditions always hold; it keeps catalogue entries terse. */
export const applies = (when: Condition | undefined, context: PlanningContext): boolean =>
  when === undefined || evaluateCondition(when, context);

/** Every field a condition reads, so catalogue tests can check each one exists. */
export function fieldsOf(condition: Condition): string[] {
  if ('all' in condition) {
    return condition.all.flatMap(fieldsOf);
  }
  if ('any' in condition) {
    return condition.any.flatMap(fieldsOf);
  }
  if ('not' in condition) {
    return fieldsOf(condition.not);
  }
  return [condition.field];
}
