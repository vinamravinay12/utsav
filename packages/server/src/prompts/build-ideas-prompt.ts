import {
  AGE_GROUPS,
  DIETARY,
  INTERESTS,
  SETTINGS,
  STYLES,
  formatInr,
  labelOf,
  seasonOf,
  type BudgetLine,
  type EventPlan,
} from '@utsav/core';
import type { LlmRequest } from '../llm/llm-client.js';
import {
  IDEA_LIMITS,
  MAX_SHARE_OF_CATEGORY,
  aiIdeasSchema,
  toResponseSchema,
} from '../validation/schemas.js';
import { DATA_NOT_INSTRUCTIONS, fenceUntrusted } from './fence-untrusted.js';

export const IDEAS_INSTRUCTION = [
  'You suggest personalised, practical ideas for an event in India.',
  `Return up to ${String(IDEA_LIMITS.count)} ideas. Each must be specific to this host’s style, interests, guests, city and season, and clearly different from the ideas they have already seen.`,
  `Each idea belongs to exactly one of the given budget categories. Its estimatedCost, in whole rupees, is the realistic extra cost of the idea itself — typically 10–30% of that category’s amount and never more than ${String(MAX_SHARE_OF_CATEGORY * 100)}%, because the category must still pay for everything else.`,
  'Respect every dietary need and the setting. Prefer local, seasonal and low-waste options when they fit.',
  'Do not include links, phone numbers, brand names or named vendors.',
  DATA_NOT_INSTRUCTIONS,
].join('\n');

/**
 * Categories an idea can spend from: everything except the reserve.
 *
 * Never empty for a valid brief: every template category has a positive share
 * and the minimum budget is ₹1,000, so each one receives money (see the tests).
 */
export const spendableLines = (plan: EventPlan): BudgetLine[] =>
  plan.budget.lines.filter((line) => !line.isContingency && line.amount > 0);

const list = <T extends string>(
  entries: readonly (readonly [T, string])[],
  ids: readonly T[],
): string => (ids.length === 0 ? 'none stated' : ids.map((id) => labelOf(entries, id)).join(', '));

export function buildIdeasRequest(plan: EventPlan, lines: readonly BudgetLine[]): LlmRequest {
  const { brief } = plan;
  const month = Number(brief.eventDate.slice(5, 7));
  const facts = [
    `Event: ${plan.eventLabel}, ${String(brief.guestCount)} guests, ${String(plan.daysUntilEvent)} days away, month ${String(month)} (${seasonOf(month)} season).`,
    `Setting: ${labelOf(SETTINGS, brief.setting)}. Style: ${labelOf(STYLES, brief.style)}. Guests: ${labelOf(AGE_GROUPS, brief.ageGroup)}.`,
    `Interests: ${list(INTERESTS, brief.interests)}. Dietary needs: ${list(DIETARY, brief.dietary)}.`,
    `Budget categories (id: amount):\n${lines.map((line) => `- ${line.categoryId} (${line.label}): ${formatInr(line.amount)}`).join('\n')}`,
    `Ideas already shown: ${plan.ideas.map((idea) => idea.title).join('; ')}.`,
    `Event name and city as the host wrote them:\n${fenceUntrusted(`${brief.name} — ${brief.city}`)}`,
  ];
  // Non-empty for any valid brief; see spendableLines.
  const ids = lines.map((line) => line.categoryId) as [string, ...string[]];
  return {
    purpose: 'ideas',
    systemInstruction: IDEAS_INSTRUCTION,
    prompt: facts.join('\n'),
    schema: toResponseSchema(aiIdeasSchema(ids)),
    temperature: 0.7,
  };
}
