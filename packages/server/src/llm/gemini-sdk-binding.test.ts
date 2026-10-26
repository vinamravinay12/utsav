import { afterEach, describe, expect, it, vi } from 'vitest';

const generateContent = vi.fn(() => Promise.resolve({ text: '{"bound":true}' }));

vi.mock('@google/genai', () => ({
  GoogleGenAI: class {
    readonly models = { generateContent };
  },
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
