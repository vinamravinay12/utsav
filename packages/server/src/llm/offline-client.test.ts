import { describe, expect, it } from 'vitest';
import { fenceUntrusted } from '../prompts/fence-untrusted.js';
import type { LlmRequest } from './llm-client.js';
import { createOfflineClient, readBudget } from './offline-client.js';

const ask = async (purpose: LlmRequest['purpose'], text: string): Promise<unknown> =>
  JSON.parse(
    await createOfflineClient().generate({
      purpose,
      systemInstruction: 'mentions wedding and birthday in our own words',
      prompt: `instructions\n${fenceUntrusted(text)}`,
      schema: {},
      temperature: 0,
    }),
  );

describe('readBudget', () => {
  it('reads lakh, thousands and rupee amounts', () => {
    expect(readBudget('about 1.5 lakh')).toBe(150_000);
    expect(readBudget('18 lac total')).toBe(1_800_000);
    expect(readBudget('around 80k')).toBe(80_000);
    expect(readBudget('₹ 80,000 budget')).toBe(80_000);
    expect(readBudget('no money mentioned')).toBeNull();
  });
});

describe('createOfflineClient', () => {
  it('reads only the fenced host text, never the instructions', async () => {
    expect(
      await ask('extract', 'A community fair in the park for 400 people, 1.5 lakh, zero-waste'),
    ).toMatchObject({
      eventType: 'community',
      guestCount: 400,
      totalBudget: 150_000,
      setting: 'outdoor',
      style: 'eco',
    });
    expect(await ask('extract', 'something unrelated')).toMatchObject({
      eventType: null,
      guestCount: null,
      setting: null,
      style: null,
    });
  });

  it('answers the guard and ideas purposes with safe, empty results', async () => {
    expect(await ask('guard', 'anything')).toMatchObject({ verdict: 'safe' });
    expect(await ask('ideas', 'anything')).toEqual({ ideas: [] });
  });
});
