---
covers:
  - src/data-api/**
  - src/db/models/task.model.ts
  - src/db/tables/task.table.ts
docs:
  - README.md
journeys:
  - tasks-crud
  - tasks-ownership
---

# Tasks

A user manages their own tasks through `/tasks/new`, `/tasks/list`, `/tasks/get`, `/tasks/edit` and `/tasks/delete`.

## Sub-features

- `tasks-crud`: a created task is owned by the caller whatever the body says, with both dates set by the server; it is listed, read, edited (the database holds the new fields and a later `updatedAt` with the same `createdAt`) and deleted; a task without a title is a 400; a deleted task is a 404.
- `tasks-ownership`: another user's list is empty, reading or editing a task of someone else is a 404, deleting it answers 200 and skips it, the task is untouched in the database; every route refuses a request without a token (401) and with a forged one.

## How to get to it (user POV)

- `curl -X POST localhost:8080/tasks/new -H "x-antelopejs-auth: $TOKEN" -d '{"title":...}'`.

## Driving it with antelopejs-verify

```bash
pnpm exec antelopejs-verify journey "$RUN" tasks
```

## Gotchas

- A `PUT /tasks/edit` with only some fields clears the others (the journey sends the title and the description together); the README does not say whether an edit replaces or merges.
- The journeys reach the npm registry and the public interfaces repository, so they need network access; the API module listens on `localhost`, which can resolve to IPv6 only, so the journeys address it as `localhost` like the README does.
