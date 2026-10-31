---
covers:
docs:
  - README.md
journeys:
  - auth-flow
---

# Smoke

The fixed journey every verdict runs: create the project, install its modules, start it and register, log in and read the profile.

## Sub-features

- `auth-flow` is described in [auth](auth.md).

## How to get to it (user POV)

- `ajs project init`, `ajs project modules install`, `ajs project dev` and the README's `curl` requests.

## Driving it with antelopejs-verify

```bash
pnpm exec antelopejs-verify journey "$RUN" smoke
```

## Gotchas

- The smoke feature covers no glob, so it never marks a file as mapped.
