# Feature map

One file per feature. `covers:` lists the source globs it owns, `docs:` the pages a verdict judges, `journeys:` the journeys it runs, and `seeded-breaks/<feature>.patch` the break its journeys must catch. `pnpm exec antelopejs-verify map` checks that every user-facing file is covered.

Every journey creates the project the way the README says: `ajs project init` from an offline manifest listing the working tree, `pnpm install`, then `ajs project modules install --yes` against the public interfaces repository (`https://github.com/AntelopeJS/interfaces`), which resolves and installs `@antelopejs/api`, `@antelopejs/auth-jwt` and `@antelopejs/mongodb` from the npm registry. The journeys then point the API at a free port and the database at a MongoDB container of the run, start `ajs project dev`, and send the README's `curl` requests with the token in `x-antelopejs-auth`. The database is read back with `mongosh` in the container as a second view next to what the API answered. They need network access for the registry and the interfaces repository.

| Feature | What the user does | Journeys |
|---|---|---|
| [scaffold](scaffold.md) | Creates the project and installs the modules its interfaces need. | scaffold-files, scaffold-modules |
| [auth](auth.md) | Registers, logs in and reads their profile. | auth-flow, auth-refused |
| [tasks](tasks.md) | Creates, reads, edits and deletes their own tasks. | tasks-crud, tasks-ownership |
| [tooling](tooling.md) | Runs the project's own checks and tests. | scaffold-checks |
| [smoke](smoke.md) | The fixed journey every verdict runs. | auth-flow |
