/**
 * Parses a model response that should be one JSON object.
 *
 * Responses are schema-constrained, so this is a defensive step: a code fence or
 * stray prose around the object is tolerated, anything unparseable is undefined.
 */
export function parseJson(raw: string): unknown {
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start === -1 || end < start) {
    return undefined;
  }
  try {
    return JSON.parse(raw.slice(start, end + 1)) as unknown;
  } catch {
    return undefined;
  }
}
