import type { Response } from 'express';
import { LlmQuotaExceededError, LlmUnavailableError } from '../llm/llm-client.js';

/**
 * Maps a model failure to a response the browser can act on. Returns false for
 * anything else, which the caller rethrows to the generic error handler.
 */
export function respondToLlmError(cause: unknown, response: Response): boolean {
  if (cause instanceof LlmQuotaExceededError) {
    response.status(429).json({
      error:
        'The AI assistant has reached its daily limit. You can still fill in the form yourself.',
    });
    return true;
  }
  if (cause instanceof LlmUnavailableError) {
    response.status(503).json({
      error: 'The AI assistant is busy right now. Try again, or fill in the form yourself.',
    });
    return true;
  }
  return false;
}
