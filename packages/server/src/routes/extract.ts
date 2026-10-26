import { Router } from 'express';
import { extractBrief, type ExtractDependencies } from '../extract/extract-brief.js';
import { resolveToday } from '../extract/resolve-today.js';
import { DESCRIPTION_LIMITS, extractRequestSchema } from '../validation/schemas.js';
import { respondToLlmError } from './llm-errors.js';

export function extractRouter(dependencies: ExtractDependencies, now: () => Date): Router {
  const router = Router();
  router.post('/extract', async (request, response) => {
    const parsed = extractRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      response.status(400).json({
        error: `Describe your event in ${String(DESCRIPTION_LIMITS.min)} to ${String(DESCRIPTION_LIMITS.max)} characters.`,
      });
      return;
    }
    try {
      const today = resolveToday(parsed.data.today, now());
      const outcome = await extractBrief(dependencies, parsed.data.description, today);
      if (outcome.status === 'rejected') {
        response.status(422).json({
          error:
            'That reads like instructions to an AI rather than an event description. Describe the event in your own words, or fill in the form.',
        });
        return;
      }
      response.json({ draft: outcome.draft, missing: outcome.missing, today });
    } catch (cause) {
      if (!respondToLlmError(cause, response)) {
        throw cause;
      }
    }
  });
  return router;
}
