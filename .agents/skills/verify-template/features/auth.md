---
covers:
  - src/routes/**
  - src/index.ts
  - src/db/index.ts
  - src/db/models/index.ts
  - src/db/models/user.model.ts
  - src/db/tables/index.ts
  - src/db/tables/user.table.ts
docs:
  - README.md
journeys:
  - auth-flow
  - auth-refused
---

# Auth

A user registers, logs in and reads their profile through `/auth/register`, `/auth/login` and `/auth/me`.

## Sub-features

- `auth-flow`: registration answers 200 and the database holds one user with the email and a salted hash in place of the password; login answers 200 with a token and the user's id; the token opens `/auth/me` with the user's own id and email; a request without a token is a 401 and a forged token is refused.
- `auth-refused`: a taken email is a 409; a password under six characters, a missing password, non-string credentials and a body that is not JSON are 400s; a wrong password and an unknown email are 401s; a login body without credentials is a 400; the database still holds the one user.

## How to get to it (user POV)

- `curl -X POST localhost:8080/auth/register -d '{"email":...,"password":...}'`, then `/auth/login` and `/auth/me` with the token in `x-antelopejs-auth`.

## Driving it with antelopejs-verify

```bash
pnpm exec antelopejs-verify journey "$RUN" auth
```

## Gotchas

- A forged token is refused with 403, where the README says the routes answer 401 without a valid token; the journeys assert that it is refused, 401 or 403, and the difference is drafted as an issue.
- The journeys reach the npm registry and the public interfaces repository, so they need network access; the API module listens on `localhost`, which can resolve to IPv6 only, so the journeys address it as `localhost` like the README does.
