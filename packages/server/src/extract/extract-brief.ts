import {
  findMissingFields,
  normalizeDraft,
  type BriefIssue,
  type NormalizedDraft,
} from '@utsav/core';
import type { TtlCache } from '../cache/ttl-cache.js';
import { cacheKey } from '../cache/ttl-cache.js';
import { judgeWithLlm, screenHeuristic } from '../guard/screen-input.js';
import { logEvent } from '../logging/log.js';
import type { LlmClient } from '../llm/llm-client.js';
import { buildExtractionRequest } from '../prompts/build-extraction-prompt.js';
import { parseJson } from '../prompts/parse-json.js';
import { extractionSchema } from '../validation/schemas.js';

export interface ExtractedBrief {
  readonly status: 'ok';
  readonly draft: NormalizedDraft;
  readonly missing: readonly BriefIssue[];
}

export type ExtractOutcome = ExtractedBrief | { readonly status: 'rejected' };

export interface ExtractDependencies {
  readonly llm: LlmClient;
  readonly cache: TtlCache<ExtractedBrief>;
}

/** Turns model output into a draft, trusting nothing: schema first, then the engine's own normaliser. */
export function readExtraction(raw: string): NormalizedDraft {
  const parsed = extractionSchema.safeParse(parseJson(raw));
  if (!parsed.success) {
    logEvent('WARNING', 'extraction answered off-schema');
    return normalizeDraft({});
  }
  // Nulls mean "not stated"; the normaliser drops them along with anything invalid.
  return normalizeDraft(parsed.data);
}

/**
 * Reads a free-text event description into a draft brief.
 *
 * The heuristic screen runs first and costs nothing. The LLM judge and the
 * extractor then run in parallel, so the second safety layer adds no latency;
 * the extraction is discarded if the judge objects. Identical requests within
 * the cache window cost no model calls at all.
 */
export async function extractBrief(
  { llm, cache }: ExtractDependencies,
  description: string,
  today: string,
): Promise<ExtractOutcome> {
  if (!screenHeuristic(description).safe) {
    return { status: 'rejected' };
  }
  const requestKey = cacheKey('extract', description, today);
  const cached = cache.get(requestKey);
  if (cached !== undefined) {
    return cached;
  }
  const [verdict, raw] = await Promise.all([
    judgeWithLlm(llm, description),
    llm.generate(buildExtractionRequest(description, today)),
  ]);
  if (!verdict.safe) {
    logEvent('WARNING', 'extraction rejected by guard', { judgedBy: verdict.judgedBy });
    return { status: 'rejected' };
  }
  const draft = readExtraction(raw);
  const extracted: ExtractedBrief = { status: 'ok', draft, missing: findMissingFields(draft) };
  cache.set(requestKey, extracted);
  return extracted;
}
