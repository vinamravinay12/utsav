import { describe, expect, it } from 'vitest';
import { DEFAULT_MODELS, DEFAULT_PORT, loadConfig, parseModels } from './config.js';

describe('loadConfig', () => {
  it('runs offline in development without a key', () => {
    expect(loadConfig({})).toEqual({
      port: DEFAULT_PORT,
      geminiApiKey: null,
      models: DEFAULT_MODELS,
      allowedOrigin: 'same-origin',
      trustProxyHops: 1,
      staticDir: null,
    });
  });

  it('refuses to start in production without a key', () => {
    expect(() => loadConfig({ NODE_ENV: 'production' })).toThrow('GEMINI_API_KEY is required');
    expect(() => loadConfig({ NODE_ENV: 'production', GEMINI_API_KEY: '   ' })).toThrow();
  });

  it('reads every setting from the environment', () => {
    expect(
      loadConfig({
        NODE_ENV: 'production',
        GEMINI_API_KEY: ' key ',
        PORT: '9000',
        ALLOWED_ORIGIN: 'https://example.test',
        TRUST_PROXY_HOPS: '2',
        STATIC_DIR: '/srv/client',
      }),
    ).toMatchObject({
      geminiApiKey: 'key',
      port: 9000,
      allowedOrigin: 'https://example.test',
      trustProxyHops: 2,
      staticDir: '/srv/client',
    });
  });

  it('falls back to defaults for invalid numbers', () => {
    expect(loadConfig({ PORT: '0' }).port).toBe(DEFAULT_PORT);
    expect(loadConfig({ PORT: '70000' }).port).toBe(DEFAULT_PORT);
    expect(loadConfig({ PORT: 'abc' }).port).toBe(DEFAULT_PORT);
    expect(loadConfig({ TRUST_PROXY_HOPS: '-1' }).trustProxyHops).toBe(1);
  });
});

describe('parseModels', () => {
  it('uses the defaults, a preferred first model, or a full list', () => {
    expect(parseModels({})).toEqual(DEFAULT_MODELS);
    expect(parseModels({ GEMINI_MODEL: 'gemini-x' })).toEqual(['gemini-x', ...DEFAULT_MODELS]);
    expect(parseModels({ GEMINI_MODEL: 'gemini-flash-lite-latest' })).toEqual([
      'gemini-flash-lite-latest',
      'gemini-3.1-flash-lite',
    ]);
    expect(parseModels({ GEMINI_MODELS: ' a, ,b ' })).toEqual(['a', 'b']);
    expect(parseModels({ GEMINI_MODELS: ' , ' })).toEqual(DEFAULT_MODELS);
  });
});
