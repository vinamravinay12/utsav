import { join, resolve } from 'node:path';
import express, { Router } from 'express';

/**
 * Serves the built web client from the same origin as the API, so the browser
 * needs no CORS and the strict same-origin CSP holds.
 *
 * Vite fingerprints every file under /assets, so those are cached for a year
 * and marked immutable. index.html is never cached, so a deploy is picked up on
 * the next load. Any other GET or HEAD outside /api returns the app shell.
 */
export function serveClient(directory: string): Router {
  // sendFile needs an absolute path; STATIC_DIR may be given relative to the cwd.
  const root = resolve(directory);
  const router = Router();
  router.use(
    '/assets',
    express.static(join(root, 'assets'), {
      immutable: true,
      maxAge: '365d',
      index: false,
      fallthrough: false,
    }),
  );
  router.use(express.static(root, { index: false, maxAge: '1h' }));
  router.use((request, response, next) => {
    const readOnly = request.method === 'GET' || request.method === 'HEAD';
    if (!readOnly || request.path.startsWith('/api')) {
      next();
      return;
    }
    response.setHeader('Cache-Control', 'no-cache');
    response.sendFile(join(root, 'index.html'));
  });
  return router;
}
