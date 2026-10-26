import { expect } from 'vitest';
import { axe } from 'vitest-axe';

/**
 * Asserts a rendered tree has no accessibility violations.
 *
 * Failures list the rule id and its help text rather than a bare boolean, so a
 * red test says what to fix.
 */
export async function expectNoViolations(container: Element): Promise<void> {
  const results = await axe(container);
  expect(results.violations.map((violation) => `${violation.id}: ${violation.help}`)).toEqual([]);
}
