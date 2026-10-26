# Code quality

Every rule below is enforced by configuration and fails the build; none is a guideline.

| Gate          | Where                                         | Setting                                                                                                                    |
| :------------ | :-------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------- |
| File size     | [`eslint.config.js`](../eslint.config.js)     | `max-lines` 150 (catalogue data files exempt)                                                                              |
| Function size | `eslint.config.js`                            | `max-lines-per-function` 60                                                                                                |
| Complexity    | `eslint.config.js`                            | `complexity` 10, `max-depth` 3, `max-params` 4                                                                             |
| Type safety   | [`tsconfig.base.json`](../tsconfig.base.json) | `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noUnusedLocals/Parameters`, `verbatimModuleSyntax`    |
| Lint profile  | `eslint.config.js`                            | `typescript-eslint` strict-type-checked + stylistic-type-checked, `jsx-a11y` strict, `react-hooks`, `eqeqeq`, `no-console` |
| Formatting    | `.prettierrc.json`                            | checked in CI                                                                                                              |
| Coverage      | [`vitest.config.ts`](../vitest.config.ts)     | 100% statements, branches, functions, lines, `all: true`                                                                   |
| Build         | `tsc -b` project references                   | core → server, core → client                                                                                               |

## Conventions

- **Pure core.** `@utsav/core` imports nothing with side effects; the date is always a parameter.
- **Knowledge as data.** Event templates, vocabularies, seasons and insight rules are declarative;
  logic lives in one tested function per concern (`evaluateCondition`, `allocateByWeight`, …).
- **One concern per module**, named for what it does (`summarize-spending.ts`, `screen-input.ts`).
- **Boundaries validate.** Zod on every request and model response; the engine's `completeBrief`
  is the single definition of a valid brief for the form, the server and restored storage.
- **Dependency injection over mocking.** The LLM client, clock, rate-limit clock, retry delay and
  SDK call are parameters, which is why the tests need almost no mocks.
- **Comments explain why**, not what: each module opens with the reason it exists.
- Strings shown to people are written for people; internal error detail goes only to the
  structured logs.
