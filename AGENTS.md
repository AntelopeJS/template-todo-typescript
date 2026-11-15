# Todo App Typescript

An AntelopeJS module template: a todo API with JWT authentication, on `@antelopejs/interface-api`, `interface-auth`, `interface-data-api` and the database interfaces. `ajs` copies the whole repository, this file included, into each module it creates from the template.

## Layout

- `src/index.ts` imports `./db`, `./routes` and `./data-api`. Those imports register the decorated tables, models and controllers, so keep them even though nothing reads their exports.
- `src/db/tables` and `src/db/models` hold the schema; `src/routes` holds the auth controller; `src/data-api` holds the task CRUD controller.
- `test/` holds the mocha suites. `antelope.test.ts` is their configuration for `ajs module test`: it builds the module with the project's own `tsc`, run by `node` without `npx`, starts it with `@antelopejs/api`, `@antelopejs/auth-jwt` and `@antelopejs/mongodb`, serves the API on a free port, and starts a throwaway MongoDB.
- The module name `antelopejs-module` appears in `package.json`, `antelope.test.ts` and, once `ajs` has written it, `antelope.config.ts`; rename it in all three.

## Versions

Every `@antelopejs/*` range stops below the next minor of its floor: `>=0.5.1 <0.6.0` on a 0.x package, `~1.23.3` on a 1.x one. AntelopeJS packages ship breaking changes in minor releases, and `@antelopejs/core` refuses to start a module whose range excludes the interface copy it loaded. The `dependency:ranges` step of `pnpm run checks` enforces it in `package.json`. The provider modules in `antelope.test.ts` follow the same rule; after changing one, delete `antelope-lock/` and run `pnpm test` to record the new module locks.

## Checks

- `pnpm run checks` runs typecheck, lint, format, knip, `pnpm test`, size, suppressions, sync and the `@antelopejs/*` dependency ranges, and prints only what failed. CI runs it through `AntelopeJS/.github/.github/workflows/ci-node.yml@v2`.
- `pnpm test` is `ajs module test`, from the `@antelopejs/core` dev dependency. The first run downloads a MongoDB binary (about 120 MB) into `~/.cache/mongodb-binaries`; set `MONGOMS_SYSTEM_BINARY` to use a local `mongod`.
- `typecheck` covers `src/`, `test/` (which has its own `tsconfig.json`) and, through `tsconfig.config.json`, `antelope.test.ts` and `antelope.config.ts`. The root `tsconfig.json` references `tsconfig.config.json` so type-aware lint reads those two files with the Node types; `tsc -p .` and the `npx tsc` build leave it unbuilt.
- `guardrails.suppressions.json` caps the lint directives, `@ts-expect-error` and `SAFETY:` comments; its numbers only go down. Fix the code rather than add a suppression.
- `pnpm run checks` needs a git repository. `ajs module init` creates one unless you decline or pass `--no-git-init`; then run `git init` first.
- `antelope.config.ts` is written by `ajs project init` and `ajs project modules install`, so oxfmt ignores it.

<!-- antelopejs-guardrails:start -->
<!-- Managed by @antelopejs/tooling-configs. `antelopejs-sync` rewrites everything between these markers; write repository-specific guidance outside them. -->

## Guardrails

Lint with `oxlint` and format with `oxfmt`; both read the configs at the repository root. Fix every finding: no rule warns.

### Comments

Say it in code: a constraint in a type, a lint rule or a test, a public item's contract in TSDoc. Other comments are lint directives naming their rules, `@ts-expect-error <reason>`, `SAFETY: <reason>` above a type assertion, and license or tool directives. A reason states what the code does now.

### Tests

Each test names the wrong implementation it fails on, or is deleted. Drive behaviour through the public interface. An invariant over many files is a lint rule.

### Review

No tool checks these:

- A type guard checks the nested elements and values it claims.
- A no-upward import rule rejects same-tier peers; probe it with an import.
- A finding only an evasion or a patched internal can trigger goes under Attention and never blocks.

<!-- antelopejs-guardrails:end -->
