import { GoogleGenAI } from '@google/genai';
import { describeCause, logEvent } from '../logging/log.js';
import {
  LlmQuotaExceededError,
  LlmUnavailableError,
  type LlmClient,
  type LlmPurpose,
  type LlmRequest,
} from './llm-client.js';
import { isQuotaExceeded, withRetry, type RetryOptions } from './retry.js';

export const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

export const DEFAULT_RETRY: RetryOptions = { attempts: 2, baseDelayMs: 500, delay: sleep };

/** A hung upstream call must not hold a request (and a Cloud Run slot) open. */
export const REQUEST_TIMEOUT_MS = 15_000;

/** Ceilings sized to each schema: a guard verdict is tiny, four ideas are not. */
export const MAX_OUTPUT_TOKENS: Readonly<Record<LlmPurpose, number>> = {
  guard: 120,
  extract: 600,
  ideas: 1200,
};

/** The shape of the SDK call this adapter makes, so tests can substitute it. */
export type GenerateContent = (
  parameters: Parameters<GoogleGenAI['models']['generateContent']>[0],
) => Promise<{ text?: string | undefined }>;

/**
 * Adapter over the Gemini Developer API.
 *
 * The key lives only in this server process. Every call is schema-constrained
 * JSON at low temperature, time-limited, retried on transient errors, and falls
 * through the model list on failure.
 */
export function createGeminiClient(
  generateContent: GenerateContent,
  models: readonly string[],
  retry: RetryOptions = DEFAULT_RETRY,
): LlmClient {
  const call = (model: string, request: LlmRequest): Promise<string> =>
    withRetry(async () => {
      const response = await generateContent({
        model,
        contents: [{ role: 'user', parts: [{ text: request.prompt }] }],
        config: {
          systemInstruction: request.systemInstruction,
          temperature: request.temperature,
          maxOutputTokens: MAX_OUTPUT_TOKENS[request.purpose],
          responseMimeType: 'application/json',
          responseJsonSchema: request.schema,
          abortSignal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        },
      });
      return response.text ?? '';
    }, retry);

  return {
    async generate(request: LlmRequest): Promise<string> {
      let lastError: unknown = new Error('No models configured');
      for (const model of models) {
        const started = Date.now();
        try {
          const text = await call(model, request);
          logEvent('INFO', 'gemini call', {
            model,
            purpose: request.purpose,
            ms: Date.now() - started,
          });
          return text;
        } catch (cause) {
          lastError = cause;
          logEvent('WARNING', 'gemini call failed', {
            model,
            purpose: request.purpose,
            cause: describeCause(cause),
          });
        }
      }
      const message = describeCause(lastError);
      throw isQuotaExceeded(lastError)
        ? new LlmQuotaExceededError(message)
        : new LlmUnavailableError(message);
    },
  };
}

/** Binds the adapter to the real SDK. */
export function createGeminiClientFromKey(apiKey: string, models: readonly string[]): LlmClient {
  const genai = new GoogleGenAI({ apiKey });
  return createGeminiClient((parameters) => genai.models.generateContent(parameters), models);
}
