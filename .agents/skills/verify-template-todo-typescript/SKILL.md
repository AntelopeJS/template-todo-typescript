---
name: verify-template-todo-typescript
description: "Check a change to AntelopeJS/template-todo-typescript before pushing: the command for each kind of change, the tools and the throwaway MongoDB the tests start, how to run one test file, and what CI and the merge queue run instead. Use before you push a change to this template."
---

# Verify a change to template-todo-typescript

CI and the merge queue test everything. You test what you changed: run the row of each kind of change your diff touches, show its command and output, and leave the rest to CI.

## Setup

Once per checkout: Node from `.nvmrc` (26) and pnpm from `packageManager` (10.34.9, through corepack), then:

```sh
pnpm install --frozen-lockfile
```

Run every command below through pnpm (`pnpm exec`, `pnpm run`), never `npx`: `npx` can pick a Node on `PATH` older than the one the tools need.

## What to run for your change

| Kind of change | Command |
| --- | --- |
| Source in `src/` | `pnpm exec oxlint <changed files>`, `pnpm exec oxfmt --check <changed files>`, `pnpm run typecheck`, then the test file that covers it: `pnpm exec ajs module test --timeout 30000 -f test/<name>.test.ts` |
| A test in `test/` | `pnpm exec oxlint <changed files>`, `pnpm exec oxfmt --check <changed files>`, `pnpm run typecheck`, `pnpm exec ajs module test --timeout 30000 -f test/<name>.test.ts` |
| `antelope.test.ts` or a provider module range in it | `pnpm run typecheck`, then one test file as above. After changing a provider range, delete `antelope-lock/` and run `pnpm test` once to record the new module locks |
| `package.json` dependencies | `pnpm install`, `pnpm run knip`, `pnpm run typecheck`. `pnpm run checks` also runs the `dependency:ranges` step that checks the `@antelopejs/*` ranges |
| Lint, format, knip or TypeScript config | `pnpm run lint`, `pnpm run format:check`, `pnpm run knip`, `pnpm run typecheck` |
| Docs (`README.md`, `AGENTS.md`, `CONTRIBUTING.md`, a skill) | `pnpm exec oxfmt --check <changed files>`, and `pnpm run sync:check` when the file is one sync writes (the AGENTS.md block, `.agents/skills/technical-writing`, `.agents/skills/unslop`) |
| `.github/workflows/ci.yml`, `@antelopejs/tooling-configs` version | `pnpm run sync` and commit what it writes, then `pnpm run sync:check`. Never edit what sync writes by hand |
| Other workflows (`module-locks.yml`) | No local command: CI runs them on the pull request |

The tests are mocha suites that `ajs module test` runs in one process, one file after another, so a scoped run uses one worker. `-f` is repeatable for more than one file. The typecheck covers `src/`, `test/` and `tsconfig.config.json` and takes a few seconds, so it runs whole.

## Services

The tests need MongoDB and the API server, and `antelope.test.ts` starts both: a throwaway `mongodb-memory-server` instance and the API on a free port, both stopped when the run ends. Start nothing yourself. The first run downloads a MongoDB binary (about 120 MB) into `~/.cache/mongodb-binaries`; set `MONGOMS_SYSTEM_BINARY` to a local `mongod` to skip the download.

## Left to CI

`.github/workflows/ci.yml` calls `AntelopeJS/.github/.github/workflows/ci-node.yml@v2`. Read the result of its jobs on your pull request; rerun none of it locally, except the scoped command of a failing check to reproduce it.

- `ci / Node .nvmrc` runs `pnpm run checks` (typecheck, lint, format, knip, size, suppressions, `sync:check`, the dependency ranges) and then the test suite on Linux. On a pull request it runs only the affected tests; in the merge queue and on `main` it runs all of them.
- The nightly schedule (and `workflow_dispatch` with `nightly`) adds the Windows legs and `ci / Stress`, which runs the tests repeatedly beside busy loops.
- `module-locks` (in `ci.yml`, and `module-locks.yml` on its own schedule) refreshes `antelope-lock/`.
- `verdict` fails when one of these jobs failed or was cancelled. The required checks are `ci / checks` and `verdict`.

## Done

Your change is checked when every row your diff touches passed, with its command and output shown. A row that cannot run says why, and that reason goes in your report.
