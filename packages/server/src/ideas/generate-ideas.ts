import {
  buildPlan,
  cleanText,
  type BudgetLine,
  type EventBrief,
  type EventPlan,
  AI_IDEA_MAX_CATEGORY_SHARE,
} from '@utsav/core';
import { cacheKey, type TtlCache } from '../cache/ttl-cache.js';
import { detectInjection } from '../guard/detect-injection.js';
import { logEvent } from '../logging/log.js';
import type { LlmClient } from '../llm/llm-client.js';
import { buildIdeasRequest, spendableLines } from '../prompts/build-ideas-prompt.js';
import { parseJson } from '../prompts/parse-json.js';
import { IDEA_LIMITS, ideaCandidateSchema, ideasEnvelopeSchema } from '../validation/schemas.js';

export interface AiIdea {
  readonly title: string;
  readonly description: string;
  readonly categoryId: string;
  readonly categoryLabel: string;
  readonly estimatedCost: number;
  /** Percentage of the category budget this idea would use. */
  readonly shareOfCategory: number;
}

export interface IdeasDependencies {
  readonly llm: LlmClient;
  readonly cache: TtlCache<readonly AiIdea[]>;
}

/** Links and contact details have no place in an idea and are the usual payload of abuse. */
const CONTACT_OR_LINK = /(https?:\/\/|www\.|\b[\w.+-]+@[\w-]+\.\w+|\+?\d[\d\s-]{8,}\d)/i;

interface Candidate {
  readonly title: string;
  readonly description: string;
  readonly categoryId: string;
  readonly estimatedCost: number;
}

/**
 * Checks every model idea against the deterministic plan.
 *
 * The model is creative; the engine is the authority. An idea survives only if
 * its category exists in this plan, its cost leaves most of that category's
 * allocation for everything else the category must pay for,
 * it carries no link or contact detail, it does not repeat an idea already
 * shown, and its text contains nothing that reads like an instruction.
 */
export function validateIdeas(
  candidates: readonly Candidate[],
  plan: EventPlan,
  lines: readonly BudgetLine[],
): AiIdea[] {
  const seen = new Set(plan.ideas.map((idea) => idea.title.toLowerCase()));
  return candidates.flatMap((candidate): AiIdea[] => {
    const line = lines.find((entry) => entry.categoryId === candidate.categoryId);
    const title = cleanText(candidate.title, IDEA_LIMITS.title);
    const description = cleanText(candidate.description, IDEA_LIMITS.description);
    const text = `${candidate.title} ${candidate.description}`;
    if (line === undefined || title === undefined || description === undefined) {
      return [];
    }
    const unsafe = CONTACT_OR_LINK.test(text) || detectInjection(text).length > 0;
    const affordable = candidate.estimatedCost <= line.amount * AI_IDEA_MAX_CATEGORY_SHARE;
    if (unsafe || !affordable || seen.has(title.toLowerCase())) {
      return [];
    }
    seen.add(title.toLowerCase());
    return [
      {
        title,
        description,
        categoryId: line.categoryId,
        categoryLabel: line.label,
        estimatedCost: candidate.estimatedCost,
        shareOfCategory: Math.round((candidate.estimatedCost / line.amount) * 100),
      },
    ];
  });
}

/**
 * Personalised ideas from Gemini, grounded in the plan the engine computed.
 *
 * The server rebuilds the plan itself from the validated brief rather than
 * trusting any numbers from the browser, so the budget the model is held to is
 * the real one.
 */
export async function generateIdeas(
  { llm, cache }: IdeasDependencies,
  brief: EventBrief,
  today: string,
): Promise<readonly AiIdea[]> {
  const key = cacheKey('ideas', brief, today);
  const cached = cache.get(key);
  if (cached !== undefined) {
    return cached;
  }
  const plan = buildPlan(brief, today);
  const lines = spendableLines(plan);
  const envelope = ideasEnvelopeSchema.safeParse(
    parseJson(await llm.generate(buildIdeasRequest(plan, lines))),
  );
  if (!envelope.success) {
    logEvent('WARNING', 'ideas answered off-schema');
    return [];
  }
  const candidates = envelope.data.ideas.flatMap((entry) => {
    const candidate = ideaCandidateSchema.safeParse(entry);
    return candidate.success ? [candidate.data] : [];
  });
  const ideas = validateIdeas(candidates, plan, lines);
  logEvent('INFO', 'ideas validated', { proposed: envelope.data.ideas.length, kept: ideas.length });
  cache.set(key, ideas);
  return ideas;
}
