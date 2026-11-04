import type { Journey } from "@antelopejs/tooling-configs/verify";

import { api, count, refusedAccess, bodyOf, freshEmail, mongo, pick, same, signIn, startProject, text } from "./session.ts";

const USERS = "db.default__users";

const authFlow: Journey = {
  title: "a user registers, logs in with the same credentials and reads their own profile with the token; the database keeps the email and only a hash of the password",
  entryPoint: "`curl` against `/auth/register`, `/auth/login` and `/auth/me` of a project scaffolded from the template",
  async run(context) {
    const running = await startProject(context);
    const email = freshEmail("ada");
    const credentials = JSON.stringify({ email, password: "secret" });
    const registered = await api(running, "register", "POST", "/auth/register", { body: credentials });
    context.expect(registered.folder, [same("registration answers 200", registered.status, "200")], { critical: true });
    const stored = await mongo(running, "mongosh reads the users", `${USERS}.find().toArray()`);
    context.expect(stored.folder, [
      same("the database holds one user with that email", [count(stored.value), pick(stored.value, 0, "email")], [1, email]),
      same("the password is stored as a salted hash and the password sent is nowhere in the document", [text(pick(stored.value, 0, "_internal", "data", "password")).length >= 20, text(pick(stored.value, 0, "_internal", "meta", "HashModifier", "salt")) !== "", JSON.stringify(stored.value).includes("secret")], [true, true, false]),
    ]);
    const login = await api(running, "login", "POST", "/auth/login", { body: credentials });
    const token = text(pick(bodyOf(login), "token"));
    const id = text(pick(bodyOf(login), "user", "id"));
    context.expect(login.folder, [
      same("login answers 200 with a token and the user", [login.status, token !== "", pick(bodyOf(login), "user", "email")], ["200", true, email]),
      same("the user id is the one the database holds", id, text(pick(stored.value, 0, "_id"))),
    ], { critical: true });
    const profile = await api(running, "me", "GET", "/auth/me", { token });
    context.expect(profile.folder, [
      same("the token opens the user's own profile", [profile.status, pick(bodyOf(profile), "id"), pick(bodyOf(profile), "email"), pick(bodyOf(profile), "authenticated")], ["200", id, email, true]),
    ]);
    const anonymous = await api(running, "me without a token", "GET", "/auth/me");
    const forged = await api(running, "me with a forged token", "GET", "/auth/me", { token: "not.a.token" });
    context.expect(forged.folder, [same("a request without a token is a 401", anonymous.status, "401"), same("a forged token is refused", refusedAccess(forged), true)]);
  },
};

const authRefused: Journey = {
  title: "registration and login refuse duplicate emails, short passwords, missing or non-string credentials and wrong passwords, and the database keeps one user",
  entryPoint: "`curl` against `/auth/register` and `/auth/login` with bodies the README does not show",
  async run(context) {
    const running = await startProject(context);
    const email = freshEmail("grace");
    await signIn(running, email);
    const duplicate = await api(running, "register again", "POST", "/auth/register", { body: JSON.stringify({ email, password: "another-secret" }) });
    const short = await api(running, "register with a short password", "POST", "/auth/register", { body: JSON.stringify({ email: freshEmail("short"), password: "12345" }) });
    const missing = await api(running, "register without a password", "POST", "/auth/register", { body: JSON.stringify({ email: freshEmail("missing") }) });
    const numbers = await api(running, "register with numbers", "POST", "/auth/register", { body: JSON.stringify({ email: 1, password: 2 }) });
    const garbage = await api(running, "register with a body that is not JSON", "POST", "/auth/register", { body: "email=a&password=b" });
    context.expect(garbage.folder, [
      same("a taken email is a 409", duplicate.status, "409"),
      same("a password under six characters is a 400", short.status, "400"),
      same("a missing password is a 400", missing.status, "400"),
      same("non-string credentials are a 400", numbers.status, "400"),
      same("a body that is not JSON is a 400", garbage.status, "400"),
    ]);
    const wrong = await api(running, "login with a wrong password", "POST", "/auth/login", { body: JSON.stringify({ email, password: "wrong-password" }) });
    const unknown = await api(running, "login with an unknown email", "POST", "/auth/login", { body: JSON.stringify({ email: freshEmail("nobody"), password: "secret" }) });
    const empty = await api(running, "login without credentials", "POST", "/auth/login", { body: "{}" });
    context.expect(empty.folder, [
      same("a wrong password is a 401", wrong.status, "401"),
      same("an unknown email is a 401", unknown.status, "401"),
      same("a login body without credentials is a 400", empty.status, "400"),
    ]);
    const stored = await mongo(running, "mongosh counts the users", `${USERS}.find({}, { email: 1 }).toArray()`);
    context.expect(stored.folder, [same("none of the refused requests created a user", [count(stored.value), pick(stored.value, 0, "email")], [1, email])]);
  },
};

export const authJourneys = { "auth-flow": authFlow, "auth-refused": authRefused };
