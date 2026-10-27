import js from '@eslint/js';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import reactHooks from 'eslint-plugin-react-hooks';
import { defineConfig, globalIgnores } from 'eslint/config';
import tseslint from 'typescript-eslint';

export default defineConfig([
  globalIgnores(['**/dist/**', '**/dist-tsc/**', '**/coverage/**']),
  js.configs.recommended,
  tseslint.configs.strictTypeChecked,
  tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: {
          // Root-level config and script files sit outside the package tsconfigs.
          allowDefaultProject: [
            'eslint.config.js',
            'vitest.config.ts',
            'packages/client/vite.config.ts',
          ],
        },
      },
    },
    rules: {
      // Small modules with one concern each. Enforced, not aspired to.
      'max-lines': ['error', { max: 150, skipBlankLines: true, skipComments: true }],
      'max-lines-per-function': ['error', { max: 60, skipBlankLines: true, skipComments: true }],
      complexity: ['error', 10],
      'max-depth': ['error', 3],
      'max-params': ['error', 4],
      eqeqeq: ['error', 'always'],
      'no-console': 'error',
      // Express identifies an error handler by its 4-argument shape, so unused
      // trailing parameters are load-bearing.
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
  {
    // Accessibility rules are errors, not warnings: a warning is a rule nobody fixes.
    files: ['packages/client/src/**/*.tsx'],
    extends: [
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- jsx-a11y ships no type declarations
      jsxA11y.flatConfigs.strict,
      reactHooks.configs.flat['recommended-latest'],
    ],
    languageOptions: {
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
  },
  {
    // Event catalogue files are declarative data — one list per file (budget,
    // tasks, vendors, ideas) — so they get a larger, but still enforced, ceiling.
    files: ['packages/core/src/catalog/events/**/*.ts'],
    rules: { 'max-lines': ['error', { max: 250, skipBlankLines: true, skipComments: true }] },
  },
  {
    // Plain-JavaScript tooling scripts: no types to check, Node globals, console output is the point.
    files: ['scripts/**/*.mjs'],
    extends: [tseslint.configs.disableTypeChecked],
    languageOptions: {
      globals: { Buffer: 'readonly', console: 'readonly', fetch: 'readonly', process: 'readonly' },
    },
    rules: { 'no-console': 'off', 'max-lines-per-function': 'off', complexity: 'off' },
  },
  {
    files: ['**/*.test.ts', '**/*.test.tsx'],
    rules: {
      'max-lines': 'off',
      'max-lines-per-function': 'off',
      // supertest types `response.body` as `any` by design; asserting on it is
      // the point of an HTTP test.
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
    },
  },
]);
