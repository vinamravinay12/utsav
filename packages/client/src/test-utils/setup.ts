import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Vitest runs without globals, so Testing Library's automatic cleanup never
// registers. Without this, renders leak between tests.
afterEach(() => {
  cleanup();
  localStorage.clear();
});
