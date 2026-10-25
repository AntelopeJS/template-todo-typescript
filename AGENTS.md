# Todo App Typescript

An AntelopeJS module template: a todo API with JWT authentication, on `@antelopejs/interface-api`, `interface-auth`, `interface-data-api` and the database interfaces. `ajs` copies the whole repository, this file included, into each module it creates from the template.

## Layout

- `src/index.ts` imports `./db`, `./routes` and `./data-api`. Those imports register the decorated tables, models and controllers, so keep them even though nothing reads their exports.
- `src/db/tables` and `src/db/models` hold the schema; `src/routes` holds the auth controller; `src/data-api` holds the task CRUD controller.
- `test/` holds the mocha suites. `antelope.test.ts` is their configuration for `ajs module test`: it builds the module with `npx tsc`, starts it with `@antelopejs/api`, `@antelopejs/auth-jwt` and `@antelopejs/mongodb`, serves the API on a free port, and starts a throwaway MongoDB.
- The module name `antelopejs-module` appears in `package.json`, `antelope.test.ts` and, once `ajs` has written it, `antelope.config.ts`; rename it in all three.

## Versions

The interface dependencies are consumer ranges, `>=<floor> <1.0.0`. Do not pin them or use a 0.x caret: `@antelopejs/core` refuses to start a module whose range excludes the interface copy it loaded.

## Checks

- `pnpm run checks` runs typecheck, lint, format, knip, `pnpm test`, size, ratchet and sync, and prints only what failed. CI runs it through `AntelopeJS/.github/.github/workflows/ci-node.yml@v1`.
- `pnpm test` is `ajs module test`, from the `@antelopejs/core` dev dependency. The first run downloads a MongoDB binary (about 120 MB) into `~/.cache/mongodb-binaries`; set `MONGOMS_SYSTEM_BINARY` to use a local `mongod`.
- `typecheck` covers `src/` only. `test/` and `antelope.test.ts` are type-checked by nothing; `ajs module test` only runs them.
- `guardrails.ratchet.json` records the lint findings the template already had. Its numbers only go down: after you remove debt, run `pnpm run ratchet:update` and commit the lowered file. A rule listed there is off for `oxlint`; the ratchet counts it instead, and the pre-commit hook rejects it on every line you add.
- lefthook runs oxfmt, oxlint, the size check and the ratchet on staged files before each commit, and `typecheck` before each push.
- `ajs` installs dependencies before it runs `git init`, so a module created from the template starts without hooks. Run `pnpm exec lefthook install` once after `git init`.
- `antelope.config.ts` is written by `ajs project init` and `ajs project modules install`, so oxfmt ignores it.

<!-- antelopejs-guardrails:start -->
<!-- Managed by @antelopejs/tooling-configs. `antelopejs-sync` rewrites everything between these markers; write repository-specific guidance outside them. -->

## Guardrails

Lint with `oxlint` and format with `oxfmt`; both read the configs at the repository root. Fix every finding: no rule warns.

### Comments

Say it in code. A constraint belongs in a type, a lint rule, or a test. A public item's contract belongs in TSDoc (`/** */`) on that item. The only other comments are lint directives that name their rules, `@ts-expect-error <reason>`, `SAFETY: <reason>` above a type assertion, `/*!` license headers, and bundler or formatter directives.

### Tests

Hold every test you write or keep to this checklist:

- Name the wrong implementation this test fails on. A test with no answer is deleted, not kept.
- No test reads the file it tests. Drive the behaviour through the public interface.
- An invariant over many files is a lint rule, not a test.

### What enforces what

| Rule                                                                           | Enforced by                               |
| ------------------------------------------------------------------------------ | ----------------------------------------- |
| Formatting                                                                     | oxfmt                                     |
| Lint findings are errors; no rule warns                                        | oxlint preset                             |
| Comments are TSDoc, directives, or `SAFETY:` only                              | `antelopejs/no-comments`                  |
| Every test asserts                                                             | `antelopejs/require-assertion`            |
| Tests read no files outside fixtures, helpers, locales                         | `antelopejs/no-fs-read-in-tests`          |
| No assertion that restates a constant                                          | `antelopejs/no-constant-value-assertion`  |
| No test whose only check is "is a function"                                    | `antelopejs/no-typeof-function-only-test` |
| Params ≤ 5, function ≤ 120 lines, file ≤ 500 lines, depth ≤ 4, complexity ≤ 20 | `eslint/max-*`, `eslint/complexity`       |

<!-- antelopejs-guardrails:end -->
