---
covers:
  - package.json
  - tsconfig.json
  - pnpm-lock.yaml
  - renovate.json
  - LICENSE
  - CONTRIBUTING.md
  - AGENTS.md
  - README.md
  - .gitignore
  - .nvmrc
docs:
  - README.md
journeys:
  - scaffold-files
  - scaffold-modules
---

# Scaffold

A new user creates a project from the template and installs the modules its interfaces need.

## Sub-features

- `scaffold-files`: the created project has every file the README's tree promises and the `.gitignore` and `.nvmrc` the repository ships, the manifest named `antelopejs-module` with the documented scripts and the six interface dependencies, and a project config that loads the module.
- `scaffold-modules`: `ajs project modules install --yes` adds the API, auth-jwt and MongoDB modules to the project config with the defaults the README names: the API on port 8080, MongoDB at `mongodb://localhost:27017` and a placeholder JWT secret.

## How to get to it (user POV)

- `ajs project init my-todo --template "Todo App Typescript"`, then `ajs project modules install --yes`.

## Driving it with antelopejs-verify

```bash
pnpm exec antelopejs-verify journey "$RUN" scaffold
```

## Gotchas

- Without `--yes`, `ajs project modules install` stops with exit code 2 when it runs without a terminal, because two modules implement `@antelopejs/interface-database`. The journey runs the README's command, `--yes` included.
- The journeys reach the npm registry and the public interfaces repository, so they need network access; the API module listens on `localhost`, which can resolve to IPv6 only, so the journeys address it as `localhost` like the README does.
