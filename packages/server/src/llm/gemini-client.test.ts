import { afterEach, describe, expect, it, vi } from 'vitest';
import { createGeminiClient, sleep, type GenerateContent } from './gemini-client.js';
import { LlmQuotaExceededError, LlmUnavailableError, type LlmRequest } from './llm-client.js';

const request: LlmRequest = {
  purpose: 'extract',
  systemInstruction: 'Extract.',
  prompt: 'Wedding for 200',
  schema: { type: 'object' },
  temperature: 0,
};

const noWait = { attempts: 2, baseDelayMs: 1, delay: () => Promise.resolve() };

describe('createGeminiClient', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sends a schema-constrained, time-limited JSON request', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const generate = vi.fn<GenerateContent>(() => Promise.resolve({ text: '{"ok":true}' }));
    const client = createGeminiClient(generate, ['model-a'], noWait);
    await expect(client.generate(request)).resolves.toBe('{"ok":true}');
    const [call] = generate.mock.calls[0] ?? [];
    expect(call).toMatchObject({
      model: 'model-a',
      contents: [{ role: 'user', parts: [{ text: 'Wedding for 200' }] }],
      config: {
        systemInstruction: 'Extract.',
        temperature: 0,
        maxOutputTokens: 600,
        responseMimeType: 'application/json',
        responseJsonSchema: { type: 'object' },
      },
    });
    expect(call?.config?.abortSignal).toBeInstanceOf(AbortSignal);
  });

  it('treats an empty response as an empty string', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const client = createGeminiClient(() => Promise.resolve({}), ['model-a'], noWait);
    await expect(client.generate(request)).resolves.toBe('');
  });

  it('falls through to the next model when one fails', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const generate = vi.fn<GenerateContent>(({ model }) =>
      model === 'busy'
        ? Promise.reject(Object.assign(new Error('busy'), { status: 503 }))
        : Promise.resolve({ text: 'second' }),
    );
    await expect(
      createGeminiClient(generate, ['busy', 'free'], noWait).generate(request),
    ).resolves.toBe('second');
    expect(generate.mock.calls.map(([parameters]) => parameters.model)).toEqual([
      'busy',
      'busy',
      'free',
    ]);
  });

  it('reports quota exhaustion distinctly from unavailability', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const quota = createGeminiClient(
      () => Promise.reject(new Error('{"code":429}')),
      ['a'],
      noWait,
    );
    await expect(quota.generate(request)).rejects.toBeInstanceOf(LlmQuotaExceededError);
    const down = createGeminiClient(() => Promise.reject(new Error('down')), ['a'], noWait);
    await expect(down.generate(request)).rejects.toBeInstanceOf(LlmUnavailableError);
    await expect(createGeminiClient(vi.fn(), [], noWait).generate(request)).rejects.toThrow(
      'No models configured',
    );
  });
});

describe('sleep', () => {
  it('resolves after the delay', async () => {
    vi.useFakeTimers();
    const done = sleep(500);
    vi.advanceTimersByTime(500);
    await expect(done).resolves.toBeUndefined();
    vi.useRealTimers();
  });
});
