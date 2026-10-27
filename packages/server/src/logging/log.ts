/* eslint-disable no-console -- the one module allowed to write to stdio */

/**
 * Structured server logs. Cloud Logging parses one JSON object per line and
 * picks up `severity`, so warnings are filterable without a logging library.
 * Responses to the browser stay vague; the detail lives here.
 */
export function logEvent(
  severity: 'INFO' | 'WARNING' | 'ERROR',
  message: string,
  fields: Readonly<Record<string, unknown>> = {},
): void {
  console.log(JSON.stringify({ severity, message, ...fields }));
}

/** A short, loggable description of any thrown value. */
export const describeCause = (cause: unknown): string =>
  cause instanceof Error ? cause.message.slice(0, 300) : String(cause);
