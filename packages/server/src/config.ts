export interface ServerConfig {
  readonly port: number;
  /** Null runs the deterministic offline client — used by tests and keyless local runs. */
  readonly geminiApiKey: string | null;
  /** Tried in order: a capacity spike on Gemini is per model, so a fallback turns an error into an answer. */
  readonly models: readonly string[];
  readonly allowedOrigin: string;
  /** Proxy hops in front of the app. Cloud Run has exactly one (Google's front end). */
  readonly trustProxyHops: number;
  /** Built client to serve, or null to run as an API only. */
  readonly staticDir: string | null;
}

/**
 * Gemini 3.6 Flash first for answer quality. Its free tier allows five requests
 * a minute per project, so the Flash-Lite models behind it take over when it is
 * busy or rate-limited rather than the host seeing an error.
 */
export const DEFAULT_MODELS: readonly string[] = [
  'gemini-3.6-flash',
  'gemini-3.1-flash-lite',
  'gemini-flash-lite-latest',
];

/** Port used when PORT is unset or invalid (Cloud Run sets it). */
export const DEFAULT_PORT = 8080;

type Env = Readonly<Record<string, string | undefined>>;

/** The trimmed value, or undefined when it is missing or blank. */
const present = (value: string | undefined): string | undefined => {
  const trimmed = value?.trim();
  return trimmed === undefined || trimmed.length === 0 ? undefined : trimmed;
};

/** `GEMINI_MODELS` replaces the list; `GEMINI_MODEL` only moves one model to the front. */
export function parseModels(env: Env): readonly string[] {
  const list = present(env.GEMINI_MODELS)
    ?.split(',')
    .map((model) => model.trim())
    .filter((model) => model.length > 0);
  if (list !== undefined && list.length > 0) {
    return list;
  }
  const primary = present(env.GEMINI_MODEL);
  return primary === undefined
    ? DEFAULT_MODELS
    : [primary, ...DEFAULT_MODELS.filter((model) => model !== primary)];
}

/** A whole number within [0, max], or the fallback. */
const parseInteger = (value: string | undefined, fallback: number, max: number): number => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 && parsed <= max ? parsed : fallback;
};

/**
 * Reads configuration from the environment.
 *
 * A missing key is tolerated in development so the app runs end to end offline,
 * but refused in production: a deployed assistant silently answering from
 * keyword rules would misrepresent what it is.
 */
export function loadConfig(env: Env): ServerConfig {
  const geminiApiKey = present(env.GEMINI_API_KEY) ?? null;
  if (env.NODE_ENV === 'production' && geminiApiKey === null) {
    throw new Error('GEMINI_API_KEY is required in production');
  }
  const port = parseInteger(env.PORT, DEFAULT_PORT, 65_535);
  return {
    port: port === 0 ? DEFAULT_PORT : port,
    geminiApiKey,
    models: parseModels(env),
    allowedOrigin: present(env.ALLOWED_ORIGIN) ?? 'same-origin',
    trustProxyHops: parseInteger(env.TRUST_PROXY_HOPS, 1, 5),
    staticDir: present(env.STATIC_DIR) ?? null,
  };
}
