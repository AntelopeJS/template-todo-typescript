---
covers:
  - test/**
  - antelope.test.ts
  - knip.config.ts
  - oxlint.config.ts
  - oxfmt.config.ts
  - guardrails.suppressions.json
docs:
  - README.md
journeys:
  - scaffold-checks
---

# Tooling

A user runs the project's own checks and tests.

## Sub-features

- `scaffold-checks`: in the scaffolded project, `pnpm run checks` passes: typecheck, lint, format, knip, the module's own tests (`ajs module test` with the API, auth-jwt and an in-memory MongoDB), size, suppressions and sync.

## How to get to it (user POV)

- `pnpm run checks`, or `pnpm test`.

## Driving it with antelopejs-verify

```bash
pnpm exec antelopejs-verify journey "$RUN" tooling
```

## Gotchas

- The in-memory MongoDB downloads a binary the first time, so the journey needs network access and can take longer on an empty cache.
- The scaffold is a copy of this repository, so the verification skill's own files are linted by the project's checks.
