import { eventTemplates, type EventTemplate } from '@utsav/core';
import type { LlmRequest } from '../llm/llm-client.js';
import { extractionSchema, toResponseSchema } from '../validation/schemas.js';
import { DATA_NOT_INSTRUCTIONS, fenceUntrusted } from './fence-untrusted.js';

/** An event type’s spendable categories as "id (Label)", for the prompt. */
const categoryList = (template: EventTemplate): string =>
  template.budget
    .filter((category) => category.isContingency !== true)
    .map((category) => `${category.id} (${category.label})`)
    .join(', ');

/**
 * The model's only job here is reading: turn a host's own words into fields.
 * It does not plan, price or advise — the deterministic engine does all of that.
 */
const EXTRACTION_INSTRUCTION = [
  'You are the intake step of an Indian event-planning assistant.',
  'Extract only facts the host states or clearly implies. Use null for anything not given; never guess.',
  'eventType: weddings, receptions and engagements are "wedding"; any birthday is "birthday"; festivals, fairs, fundraisers, drives, club or residents-association events are "community". Anything else is null.',
  'eventDate: resolve relative dates ("next February 14", "in ten weeks", "this Sunday") against today’s date to YYYY-MM-DD. A month without a day is null.',
  'totalBudget: whole Indian rupees. 1 lakh = 100000, 1 crore = 10000000, "80k" = 80000. If several figures appear, use the total.',
  'guestCount: one number; for a range use the upper end.',
  'style: the closest single match only if the host describes the feel of the event.',
  'ageGroup: "all-ages" when the crowd mixes children and adults.',
  'priorities: up to three budget category ids for what the host says matters most or wants to spend on ("photos matter most" means photography, "great food" means catering), chosen only from the list for that event type. Empty if nothing is emphasised.',
  'name: a short label such as "Asha & Rohan’s wedding" when names are given, otherwise null.',
  DATA_NOT_INSTRUCTIONS,
].join('\n');

/** JSON Schema the extraction is decoded against. */
export const EXTRACTION_RESPONSE_SCHEMA = toResponseSchema(extractionSchema);

/** The extraction call for one description: today’s date, the category ids and the fenced text. */
export function buildExtractionRequest(description: string, today: string): LlmRequest {
  const categories = eventTemplates
    .map((template) => `- ${template.id}: ${categoryList(template)}`)
    .join('\n');
  return {
    purpose: 'extract',
    systemInstruction: EXTRACTION_INSTRUCTION,
    prompt: `Today is ${today}.\nBudget category ids by event type:\n${categories}\n\nHost’s description:\n${fenceUntrusted(description)}`,
    schema: EXTRACTION_RESPONSE_SCHEMA,
    temperature: 0,
  };
}
