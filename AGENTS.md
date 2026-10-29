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

- `pnpm run checks` runs typecheck, lint, format, knip, `pnpm test`, size, ratchet, suppressions and sync, and prints only what failed. CI runs it through `AntelopeJS/.github/.github/workflows/ci-node.yml@v1`.
- `pnpm test` is `ajs module test`, from the `@antelopejs/core` dev dependency. The first run downloads a MongoDB binary (about 120 MB) into `~/.cache/mongodb-binaries`; set `MONGOMS_SYSTEM_BINARY` to use a local `mongod`.
- `typecheck` covers `src/` only. `test/` and `antelope.test.ts` are type-checked by nothing; `ajs module test` only runs them.
- `guardrails.suppressions.json` caps the lint directives, `@ts-expect-error` and `SAFETY:` comments; its numbers only go down. Fix the code rather than add a suppression.
- `guardrails.ratchet.json` records the lint findings the template already had. Its numbers only go down: after you remove debt, run `pnpm run ratchet:update` and commit the lowered file. A rule listed there is off for `oxlint`; the ratchet counts it instead, and the pre-commit hook rejects it on every line you add.
- lefthook runs oxfmt, oxlint, the size check and the ratchet on staged files before each commit, and `typecheck` before each push.
- `ajs` installs dependencies before it runs `git init`, so a module created from the template starts without hooks. Make the first commit with `git commit --no-verify`, then run `pnpm exec lefthook install`. With no previous commit, the ratchet hook counts every recorded finding as an added line and rejects that first commit.
- `antelope.config.ts` is written by `ajs project init` and `ajs project modules install`, so oxfmt ignores it.

<!-- antelopejs-guardrails:start -->
<!-- Managed by @antelopejs/tooling-configs. `antelopejs-sync` rewrites everything between these markers; write repository-specific guidance outside them. -->

## Guardrails

Lint with `oxlint` and format with `oxfmt`; both read the configs at the repository root. Fix every finding: no rule warns.

### Comments

Say it in code. A constraint belongs in a type, a lint rule, or a test. A public item's contract belongs in TSDoc (`/** */`) on that item. The only other comments are lint directives that name their rules, `@ts-expect-error <reason>`, `SAFETY: <reason>` above a type assertion, `/*!` license headers, and bundler or formatter directives.

Before suppressing a type rule, try inference or a type derived from its owner with `Parameters`, `ReturnType`, or indexed access. A private alias can still appear in a published declaration. Keep a suppression only after checking the published contract and the unchecked boundary it protects.

Check each directive reason against the current line and its callers. Returning a value is not the same as awaiting and discarding it. A reason must describe what the code does now.

### Tests

Hold every test you write or keep to this checklist:

- Name the wrong implementation this test fails on. A test with no answer is deleted, not kept.
- No test reads the file it tests. Drive the behaviour through the public interface.
- An invariant over many files is a lint rule, not a test.

### Cleanup proof

A behaviour-preserving cleanup PR shows `antelopejs-api-diff <base-ref>` passing. Published declarations and built runtime exports stay unchanged; pass `--allow-added <glob>` (repeatable, e.g. `'**/internal/**'`) to let added entries under that glob pass when their module is `@internal`, and copy its "Added (allowed)" list. A comment-only PR shows `antelopejs-comment-proof <base-ref>` passing instead of a verifier. Both compare committed HEAD.

Copy counts from the proof's base and HEAD table. Never type counts by hand. Keep the command and the committed head beside the copied output. The table counts a lint directive once per rule it names, inline directives included.

Pass `--probe <file.cjs>` to api-diff when changing receivers, positional calls, or modules that no published entry reaches. The same captured script runs against both worktree roots, supplied as `argv[2]`, and prints JSON observations. Matching metadata alone does not prove those behaviours.

An entry-only rule exempts only its own module. Add a second module entry rather than exempting another importer. A no-upward rule must reject peers in the same tier as well as higher tiers. Probe the rank decision with an import, not just a reading of the configuration.

Moving a method body into a function keeps how it is called: the same receiver, argument count, read order and laziness.

Verify a boundary against the imports a developer or agent would plausibly write: static and dynamic imports, re-exports, Vue `src`, CSS `@import`, and worker or child-process entries in normally named files. A construction only an evasion would write, an edit to resolution configuration (`package.json` `browser`, `exports`, `main` or `imports`, bundler aliases, tsconfig `paths`), and a difference observable only by patching private fields or internal methods go under Attention and never block. Public API and ordinary subclass behaviour stay part of the contract.

### What enforces what

| Rule                                                                           | Enforced by                                         |
| ------------------------------------------------------------------------------ | --------------------------------------------------- |
| Formatting                                                                     | oxfmt                                               |
| Lint findings are errors; no rule warns                                        | oxlint preset                                       |
| Comments are TSDoc, directives, or `SAFETY:` only                              | `antelopejs/no-comments`                            |
| Every test asserts                                                             | `antelopejs/require-assertion`                      |
| Tests read no files outside fixtures, helpers, locales                         | `antelopejs/no-fs-read-in-tests`                    |
| Tests import the code under test from local source, not their own package name | `antelopejs/no-self-import-in-tests`                |
| No assertion that restates a constant                                          | `antelopejs/no-constant-value-assertion`            |
| No test whose only check is "is a function"                                    | `antelopejs/no-typeof-function-only-test`           |
| Params ≤ 5, function ≤ 120 lines, file ≤ 500 lines, depth ≤ 4, complexity ≤ 20 | `eslint/max-*`, `eslint/complexity`                 |
| Cleanup preserves declarations and built runtime export metadata               | `antelopejs-api-diff <base-ref>`                    |
| Comment-only changes preserve JavaScript emit                                  | `antelopejs-comment-proof <base-ref>`               |
| PR-body counts come from tracked code files                                    | api-diff and comment-proof tables                   |
| Receiver, positional and unpublished-module behaviour                          | `antelopejs-api-diff <base-ref> --probe <file.cjs>` |
| Directive and `SAFETY:` reasons are true of the code                           | review; no tool                                     |
| Evasion-only and patched-internal findings go under Attention                  | review; no tool                                     |
| No-upward rules reject same-tier peers                                         | review and import probes                            |
| No `@ts-ignore`                                                                | `typescript/ban-ts-comment`                         |

<!-- antelopejs-guardrails:end -->
