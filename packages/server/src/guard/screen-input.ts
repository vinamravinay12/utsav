import { describeCause, logEvent } from '../logging/log.js';
import type { LlmClient } from '../llm/llm-client.js';
import { buildGuardRequest } from '../prompts/build-guard-prompt.js';
import { parseJson } from '../prompts/parse-json.js';
import { guardVerdictSchema } from '../validation/schemas.js';
import { detectInjection } from './detect-injection.js';

export type ScreenResult =
  | { readonly safe: true; readonly judgedBy: 'heuristic' | 'llm' }
  | { readonly safe: false; readonly judgedBy: 'heuristic' | 'llm'; readonly reason: string };

/** Layer one: patterns that catch blatant attempts without spending a model call. */
export function screenHeuristic(text: string): ScreenResult {
  const [finding] = detectInjection(text);
  return finding === undefined
    ? { safe: true, judgedBy: 'heuristic' }
    : { safe: false, judgedBy: 'heuristic', reason: `Matched ${finding.rule}` };
}

/**
 * Layer two: an independent LLM judge for paraphrased or obfuscated attempts.
 *
 * If the judge is unavailable or answers off-schema, the request proceeds on the
 * heuristic result. That is a deliberate fail-open: the extractor's output is
 * schema-constrained to closed vocabularies, so even a successful injection can
 * only choose wrong values, which the host sees and corrects on the review form.
 */
export async function judgeWithLlm(llm: LlmClient, text: string): Promise<ScreenResult> {
  try {
    const verdict = guardVerdictSchema.safeParse(
      parseJson(await llm.generate(buildGuardRequest(text))),
    );
    if (!verdict.success) {
      logEvent('WARNING', 'guard answered off-schema; heuristic only');
      return { safe: true, judgedBy: 'heuristic' };
    }
    return verdict.data.verdict === 'manipulation'
      ? { safe: false, judgedBy: 'llm', reason: verdict.data.reason }
      : { safe: true, judgedBy: 'llm' };
  } catch (cause) {
    logEvent('WARNING', 'guard unavailable; heuristic only', { cause: describeCause(cause) });
    return { safe: true, judgedBy: 'heuristic' };
  }
}
