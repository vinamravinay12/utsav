import { applies } from '../conditions/evaluate-condition.js';
import type { Insight, InsightRule, PlanningContext, Severity } from '../types/index.js';

const SEVERITY_ORDER: Readonly<Record<Severity, number>> = { critical: 0, warning: 1, info: 2 };

const PLACEHOLDER = /\{(\w+)\}/g;

/**
 * Fills `{field}` placeholders from the context. A placeholder with no matching
 * field is left as written, so a typo shows up in review instead of vanishing.
 */
export function interpolate(template: string, context: PlanningContext): string {
  return template.replace(PLACEHOLDER, (whole, field: string) => {
    const contextValue = context[field];
    if (typeof contextValue === 'number') {
      return contextValue.toLocaleString('en-IN');
    }
    return typeof contextValue === 'string' ? contextValue : whole;
  });
}

/** Rules that hold for this brief, most severe first, in catalogue order within a severity. */
export function evaluateInsights(
  rules: readonly InsightRule[],
  context: PlanningContext,
): Insight[] {
  return rules
    .filter((rule) => applies(rule.when, context))
    .sort((first, second) => SEVERITY_ORDER[first.severity] - SEVERITY_ORDER[second.severity])
    .map((rule) => ({
      id: rule.id,
      severity: rule.severity,
      title: interpolate(rule.title, context),
      detail: interpolate(rule.detail, context),
    }));
}
