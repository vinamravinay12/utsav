import { Router } from 'express';

/** GET /api/health — liveness and which model mode is running. */
export function healthRouter(mode: 'gemini' | 'offline'): Router {
  const router = Router();
  router.get('/health', (_request, response) => {
    // Reports whether a key is in use, never anything about the key itself.
    response.setHeader('Cache-Control', 'no-store');
    response.json({ status: 'ok', mode });
  });
  return router;
}
