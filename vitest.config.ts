import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'node',
          environment: 'node',
          include: ['packages/{core,server}/src/**/*.test.ts'],
        },
      },
      {
        plugins: [react()],
        test: {
          name: 'client',
          environment: 'jsdom',
          include: ['packages/client/src/**/*.test.{ts,tsx}'],
          setupFiles: ['./packages/client/src/test-utils/setup.ts'],
        },
      },
    ],
    coverage: {
      provider: 'v8',
      // Count every source file, not only the ones a test happened to import.
      all: true,
      reporter: ['text', 'html', 'lcov', 'json-summary'],
      include: [
        'packages/core/src/**/*.ts',
        'packages/server/src/**/*.ts',
        'packages/client/src/**/*.{ts,tsx}',
      ],
      // `index.ts` in the server and `main.tsx` in the client only bind to the
      // outside world (a port, a DOM node). Everything they wire up is tested.
      exclude: [
        '**/*.test.{ts,tsx}',
        '**/types/**',
        'packages/server/src/index.ts',
        'packages/client/src/main.tsx',
        '**/test-utils/**',
      ],
      thresholds: {
        lines: 100,
        functions: 100,
        branches: 100,
        statements: 100,
      },
    },
  },
});
