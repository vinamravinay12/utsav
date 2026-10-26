import type { NextFunction, Request, Response } from 'express';

/** The API returns JSON only, so its policy forbids everything. */
export const API_CSP =
  "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'";

/**
 * The web client's policy: same-origin scripts, styles and API calls only, no
 * inline script, no framing. The client is built so it never needs more.
 */
export const APP_CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  'upgrade-insecure-requests',
].join('; ');

const COMMON_HEADERS: readonly (readonly [string, string])[] = [
  ['X-Content-Type-Options', 'nosniff'],
  ['X-Frame-Options', 'DENY'],
  ['Referrer-Policy', 'no-referrer'],
  ['Cross-Origin-Opener-Policy', 'same-origin'],
  ['Cross-Origin-Resource-Policy', 'same-origin'],
  ['Origin-Agent-Cluster', '?1'],
  ['X-Permitted-Cross-Domain-Policies', 'none'],
  ['Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(), usb=()'],
  ['Strict-Transport-Security', 'max-age=63072000; includeSubDomains'],
];

/**
 * Security headers for every response.
 *
 * Cross-origin access is off unless an origin is configured: the client is
 * served from the same origin as the API, so no browser needs CORS at all.
 */
export function securityHeaders(allowedOrigin: string) {
  return (request: Request, response: Response, next: NextFunction): void => {
    for (const [name, value] of COMMON_HEADERS) {
      response.setHeader(name, value);
    }
    const isApi = request.path.startsWith('/api');
    response.setHeader('Content-Security-Policy', isApi ? API_CSP : APP_CSP);
    if (isApi && allowedOrigin !== 'same-origin') {
      response.setHeader('Access-Control-Allow-Origin', allowedOrigin);
      response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      response.setHeader('Access-Control-Allow-Methods', 'GET, POST');
      response.setHeader('Vary', 'Origin');
    }
    if (isApi && request.method === 'OPTIONS') {
      response.status(204).end();
      return;
    }
    next();
  };
}
