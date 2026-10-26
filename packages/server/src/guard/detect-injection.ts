export interface InjectionFinding {
  readonly rule: string;
  readonly excerpt: string;
}

const EXCERPT_LIMIT = 80;

/**
 * Cheap first-pass patterns, anchored to text that addresses an AI assistant.
 *
 * Event descriptions are full of imperatives ("ignore the rain forecast", "you
 * must book early") so each pattern needs the vocabulary of prompts — rules,
 * instructions, system prompt, role — not just a command verb.
 */
const RULES: readonly (readonly [string, RegExp])[] = [
  [
    'override-instructions',
    /\b(ignore|disregard|forget|override)\b[^.\n]{0,40}\b(instructions?|prompts?|rules|guidelines)\b/i,
  ],
  [
    'identity-reassignment',
    /\b(you are now|pretend (to be|you are)|act as (an?|the) (ai|assistant|system|developer)|from now on,? you)\b/i,
  ],
  [
    'system-prompt-probe',
    /\b(system prompt|developer message|hidden instructions|reveal (your|the) (prompt|instructions))\b/i,
  ],
  ['injected-directive', /\b(new|updated|revised|real) (system )?instructions?\s*[:-]/i],
  [
    'role-markup',
    /(<\/?(system|assistant|instructions?)>|\[(system|inst)\]|^\s*(system|assistant)\s*:)/im,
  ],
];

/** Patterns that point at text addressing the model rather than describing an event. */
export function detectInjection(text: string): readonly InjectionFinding[] {
  return RULES.flatMap(([rule, pattern]): InjectionFinding[] => {
    const match = pattern.exec(text);
    return match === null ? [] : [{ rule, excerpt: match[0].slice(0, EXCERPT_LIMIT) }];
  });
}
