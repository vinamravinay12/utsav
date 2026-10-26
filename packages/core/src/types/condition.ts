/** A value the planning context exposes to declarative rules. */
export type ContextValue = string | number | boolean | readonly string[];

export type PlanningContext = Readonly<Record<string, ContextValue>>;

/**
 * A declarative predicate over the planning context.
 *
 * Catalogue entries and insight rules carry these instead of code, so new
 * planning knowledge is added as data and evaluated by one tested function.
 */
export type Condition =
  | { readonly field: string; readonly equals: string | number | boolean }
  | { readonly field: string; readonly oneOf: readonly string[] }
  | { readonly field: string; readonly atLeast: number }
  | { readonly field: string; readonly below: number }
  | { readonly field: string; readonly has: string }
  | { readonly all: readonly Condition[] }
  | { readonly any: readonly Condition[] }
  | { readonly not: Condition };
