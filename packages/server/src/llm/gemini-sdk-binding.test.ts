import { afterEach, describe, expect, it, vi } from 'vitest';

const generateContent = vi.fn(() => Promise.resolve({ text: '{"bound":true}' }));

// Only the client class is replaced; enums such as ThinkingLevel stay real.
vi.mock(import('@google/genai'), async (importOriginal) => ({
  ...(await importOriginal()),
  GoogleGenAI: class {
    readonly models = { generateContent };
  } as never,
}));

const { createGeminiClientFromKey } = await import('./gemini-client.js');

describe('createGeminiClientFromKey', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('routes calls through the SDK’s generateContent', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const client = createGeminiClientFromKey('test-key', ['model-a']);
    await expect(
      client.generate({
        purpose: 'guard',
        systemInstruction: 's',
        prompt: 'p',
        schema: {},
        temperature: 0,
      }),
    ).resolves.toBe('{"bound":true}');
    expect(generateContent).toHaveBeenCalledOnce();
  });
});
