/**
 * The rule every AI-suggested idea must meet: an idea is an addition to a budget
 * category, not the whole of it, so the rest of the category stays funded.
 *
 * Lives in the engine so the server's validator, the prompt and the page that
 * explains the rule to the host all read the same number.
 */
export const AI_IDEA_MAX_CATEGORY_SHARE = 0.6;

/** "60%" — the cap as the host reads it. */
export const formatShare = (share: number): string => `${String(Math.round(share * 100))}%`;
