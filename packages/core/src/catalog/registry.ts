import type { EventTemplate, EventTypeId } from '../types/index.js';
import { birthday } from './events/birthday.js';
import { community } from './events/community.js';
import { wedding } from './events/wedding.js';

/** Every event type the planner supports. Adding one is a new data file and a line here. */
export const eventTemplates: readonly EventTemplate[] = [wedding, birthday, community];

export function findTemplate(id: EventTypeId): EventTemplate {
  const template = eventTemplates.find((candidate) => candidate.id === id);
  if (template === undefined) {
    throw new RangeError(`No template for event type ${id}`);
  }
  return template;
}
