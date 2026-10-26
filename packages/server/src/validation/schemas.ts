import {
  AGE_GROUP_IDS,
  BRIEF_LIMITS,
  DIETARY_IDS,
  EVENT_TYPE_IDS,
  INTEREST_IDS,
  SETTING_IDS,
  STYLE_IDS,
} from '@utsav/core';
import { z } from 'zod';

export const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export const DESCRIPTION_LIMITS = { min: 15, max: 2000 } as const;

// ---- Requests from the browser -------------------------------------------------

export const extractRequestSchema = z.object({
  description: z.string().trim().min(DESCRIPTION_LIMITS.min).max(DESCRIPTION_LIMITS.max),
  today: z.string().regex(ISO_DATE),
});

/** The brief itself is re-checked field by field by the engine's own validator. */
export const ideasRequestSchema = z.object({
  brief: z.record(z.string(), z.unknown()),
  today: z.string().regex(ISO_DATE),
});

// ---- Responses from the model --------------------------------------------------
// These double as the JSON Schema Gemini decodes against, so the model cannot
// produce a value outside the vocabulary in the first place.

export const extractionSchema = z.object({
  eventType: z.enum(EVENT_TYPE_IDS).nullable(),
  name: z.string().max(BRIEF_LIMITS.maxNameLength).nullable(),
  eventDate: z.string().regex(ISO_DATE).nullable(),
  guestCount: z.number().int().min(0).max(1_000_000).nullable(),
  totalBudget: z.number().int().min(0).max(10_000_000_000).nullable(),
  city: z.string().max(BRIEF_LIMITS.maxCityLength).nullable(),
  setting: z.enum(SETTING_IDS).nullable(),
  style: z.enum(STYLE_IDS).nullable(),
  ageGroup: z.enum(AGE_GROUP_IDS).nullable(),
  priorities: z.array(z.string()).max(BRIEF_LIMITS.maxPriorities),
  interests: z.array(z.enum(INTEREST_IDS)),
  dietary: z.array(z.enum(DIETARY_IDS)),
});

export const guardVerdictSchema = z.object({
  verdict: z.enum(['safe', 'manipulation']),
  reason: z.string().max(200),
});

export const IDEA_LIMITS = { count: 4, title: 70, description: 240 } as const;

/** An idea is an addition to a category, not the whole of it: the rest must stay funded. */
export const MAX_SHARE_OF_CATEGORY = 0.6;

const ideaFields = {
  title: z.string().min(3).max(IDEA_LIMITS.title),
  description: z.string().min(10).max(IDEA_LIMITS.description),
  estimatedCost: z.number().int().min(1).max(100_000_000),
};

/** What the model is constrained to: the category must be one of this plan's. */
export function aiIdeasSchema(categoryIds: readonly [string, ...string[]]) {
  return z.object({
    ideas: z
      .array(z.object({ ...ideaFields, categoryId: z.enum(categoryIds) }))
      .max(IDEA_LIMITS.count),
  });
}

/**
 * What the server parses: each idea on its own, so one malformed idea is
 * dropped without discarding the rest. Category membership is checked later
 * against the plan itself.
 */
export const ideasEnvelopeSchema = z.object({ ideas: z.array(z.unknown()).max(IDEA_LIMITS.count) });

export const ideaCandidateSchema = z.object({ ...ideaFields, categoryId: z.string() });

/** Zod to JSON Schema, minus the `$schema` marker the Gemini API does not accept. */
export function toResponseSchema(schema: z.ZodType): Record<string, unknown> {
  const { $schema: _ignored, ...rest } = z.toJSONSchema(schema) as Record<string, unknown>;
  return rest;
}

export type Extraction = z.infer<typeof extractionSchema>;
export type GuardVerdict = z.infer<typeof guardVerdictSchema>;
