/** What a model call is for; used in logs and to pick a token ceiling. */
export type LlmPurpose = 'guard' | 'extract' | 'ideas';

export interface LlmRequest {
  readonly purpose: LlmPurpose;
  readonly systemInstruction: string;
  /** The user turn. Untrusted text inside it is always fenced. */
  readonly prompt: string;
  /** JSON Schema the response is constrained to at decode time. */
  readonly schema: Readonly<Record<string, unknown>>;
  readonly temperature: number;
}

/**
 * The entire surface the app needs from a language model.
 *
 * One method keeps prompt construction and response validation in pure, fully
 * tested modules; the only untested part is the network call itself.
 */
export interface LlmClient {
  generate(request: LlmRequest): Promise<string>;
}

/** Every configured model failed; the host can try again or fill in the form. */
export class LlmUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LlmUnavailableError';
  }
}

/** Quota is exhausted: waiting a few seconds will not help, so the user is told plainly. */
export class LlmQuotaExceededError extends LlmUnavailableError {
  constructor(message: string) {
    super(message);
    this.name = 'LlmQuotaExceededError';
  }
}
