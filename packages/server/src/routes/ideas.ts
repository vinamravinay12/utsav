import { completeBrief } from '@utsav/core';
import { Router } from 'express';
import { resolveToday } from '../extract/resolve-today.js';
import { screenHeuristic } from '../guard/screen-input.js';
import { generateIdeas, type IdeasDependencies } from '../ideas/generate-ideas.js';
import { ideasRequestSchema } from '../validation/schemas.js';
import { respondToLlmError } from './llm-errors.js';

/** POST /api/ideas — Gemini ideas checked against the server-built plan. */
export function ideasRouter(dependencies: IdeasDependencies, now: () => Date): Router {
  const router = Router();
  router.post('/ideas', async (request, response) => {
    const parsed = ideasRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      response.status(400).json({ error: 'A brief and a YYYY-MM-DD date are required.' });
      return;
    }
    const today = resolveToday(parsed.data.today, now());
    const result = completeBrief(parsed.data.brief, today);
    if (!result.ok) {
      response.status(400).json({ error: 'The brief is incomplete.', issues: result.issues });
      return;
    }
    // Name and city are the only free text in a brief. They are short and
    // cleaned by the engine, so the pattern layer is enough here.
    if (!screenHeuristic(`${result.brief.name} ${result.brief.city}`).safe) {
      response.status(422).json({ error: 'The event name or city contains text we cannot use.' });
      return;
    }
    try {
      response.json({ ideas: await generateIdeas(dependencies, result.brief, today) });
    } catch (cause) {
      if (!respondToLlmError(cause, response)) {
        throw cause;
      }
    }
  });
  return router;
}
