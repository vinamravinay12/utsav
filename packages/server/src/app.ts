import compression from 'compression';
import express, { type Express, type NextFunction, type Request, type Response } from 'express';
import { createTtlCache } from './cache/ttl-cache.js';
import type { ServerConfig } from './config.js';
import type { ExtractedBrief } from './extract/extract-brief.js';
import type { AiIdea } from './ideas/generate-ideas.js';
import { describeCause, logEvent } from './logging/log.js';
import type { LlmClient } from './llm/llm-client.js';
import { extractRouter } from './routes/extract.js';
import { healthRouter } from './routes/health.js';
import { ideasRouter } from './routes/ideas.js';
import { rateLimit, type RateLimitOptions } from './security/rate-limit.js';
import { securityHeaders } from './security/security-headers.js';
import { serveClient } from './static/serve-client.js';

/** A brief or a description is a few kilobytes at most. */
const BODY_LIMIT = '16kb';

const CACHE_ENTRIES = 500;
const CACHE_TTL_MS = 15 * 60_000;

export interface AppDependencies {
  readonly llm: LlmClient;
  readonly config: ServerConfig;
  readonly mode: 'gemini' | 'offline';
  readonly now?: () => Date;
  readonly rateLimitOptions?: RateLimitOptions;
}

const KNOWN_ERRORS: Readonly<Record<string, { status: number; message: string }>> = {
  'entity.parse.failed': { status: 400, message: 'Request body must be valid JSON.' },
  'entity.too.large': { status: 413, message: 'Request is too large.' },
};

/**
 * Errors the framework raises on purpose — a body that will not parse, a
 * missing static file — carry a type or a 4xx status. Anything else is a bug.
 */
export function describeBodyError(error: unknown): { status: number; message: string } | undefined {
  if (typeof error !== 'object' || error === null) {
    return undefined;
  }
  const { type, status } = error as { type?: unknown; status?: unknown };
  const known = typeof type === 'string' ? KNOWN_ERRORS[type] : undefined;
  if (known !== undefined) {
    return known;
  }
  return status === 404 ? { status: 404, message: 'Not found.' } : undefined;
}

const notFound = (_request: Request, response: Response): void => {
  response.status(404).json({ error: 'Not found.' });
};

function errorHandler(
  error: unknown,
  _request: Request,
  response: Response,
  _next: NextFunction,
): void {
  const known = describeBodyError(error);
  if (known === undefined) {
    logEvent('ERROR', 'unhandled error', { cause: describeCause(error) });
  }
  // Never surface an internal message: it can leak configuration detail.
  response.status(known?.status ?? 500).json({ error: known?.message ?? 'Something went wrong.' });
}

export function createApp({
  llm,
  config,
  mode,
  now = () => new Date(),
  rateLimitOptions,
}: AppDependencies): Express {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', config.trustProxyHops);
  app.use(compression());
  app.use(securityHeaders(config.allowedOrigin));
  app.use('/api', express.json({ limit: BODY_LIMIT }));
  const limiter = rateLimit(rateLimitOptions);
  app.use('/api/extract', limiter);
  app.use('/api/ideas', limiter);
  app.use('/api', healthRouter(mode));
  app.use(
    '/api',
    extractRouter({ llm, cache: createTtlCache<ExtractedBrief>(CACHE_ENTRIES, CACHE_TTL_MS) }, now),
  );
  app.use(
    '/api',
    ideasRouter(
      { llm, cache: createTtlCache<readonly AiIdea[]>(CACHE_ENTRIES, CACHE_TTL_MS) },
      now,
    ),
  );
  app.use('/api', notFound);
  if (config.staticDir !== null) {
    app.use(serveClient(config.staticDir));
  }
  app.use(notFound);
  app.use(errorHandler);
  return app;
}
