import type { Journey } from "@antelopejs/tooling-configs/verify";

import { api, count, refusedAccess, type Send, bodyOf, freshEmail, mongo, pick, same, signIn, startProject, text } from "./session.ts";

const TASKS = "db.default__tasks";

const tasksCrud: Journey = {
  title: "a user creates, lists, reads, edits and deletes their own task; the owner and the dates are set by the server and the database agrees at every step",
  entryPoint: "`curl` against `/tasks/new`, `/tasks/list`, `/tasks/get`, `/tasks/edit` and `/tasks/delete` with the `x-antelopejs-auth` token",
  async run(context) {
    const running = await startProject(context);
    const user = await signIn(running, freshEmail("ada"));
    const created = await api(running, "new task", "POST", "/tasks/new", { token: user.token, body: JSON.stringify({ title: "Try AntelopeJS", description: "first", userId: "somebody-else" }) });
    const id = text(pick(bodyOf(created), 0));
    context.expect(created.folder, [same("creation answers 200 with the new task's id", [created.status, id !== ""], ["200", true])], { critical: true });
    const stored = await mongo(running, "mongosh reads the tasks", `${TASKS}.find().toArray()`);
    context.expect(stored.folder, [
      same("the database holds the task with the user as owner, whatever the body said", [count(stored.value), pick(stored.value, 0, "_id"), pick(stored.value, 0, "title"), pick(stored.value, 0, "userId")], [1, id, "Try AntelopeJS", user.id]),
      same("both dates were set when it was created", pick(stored.value, 0, "createdAt") === pick(stored.value, 0, "updatedAt") && pick(stored.value, 0, "createdAt") !== undefined, true),
    ]);
    const listed = await api(running, "list", "GET", "/tasks/list", { token: user.token });
    context.expect(listed.folder, [
      same("the list holds the task with its fields", [listed.status, pick(bodyOf(listed), "total"), pick(bodyOf(listed), "results", 0, "_id"), pick(bodyOf(listed), "results", 0, "description")], ["200", 1, id, "first"]),
    ]);
    const read = await api(running, "get", "GET", `/tasks/get?id=${id}`, { token: user.token });
    context.expect(read.folder, [same("reading it returns the same task", [read.status, pick(bodyOf(read), "title"), pick(bodyOf(read), "userId")], ["200", "Try AntelopeJS", user.id])]);
    await new Promise((resolve) => setTimeout(resolve, 1100));
    const edited = await api(running, "edit", "PUT", `/tasks/edit?id=${id}`, { token: user.token, body: JSON.stringify({ title: "Done", description: "first" }) });
    const after = await mongo(running, "mongosh reads the edited task", `${TASKS}.find().toArray()`);
    context.expect(after.folder, [
      same("the edit answers 200", edited.status, "200"),
      same("the database holds the new title and the description sent with it", [pick(after.value, 0, "title"), pick(after.value, 0, "description")], ["Done", "first"]),
      same("the edit refreshed updatedAt and left createdAt", [Date.parse(text(pick(after.value, 0, "updatedAt"))) > Date.parse(text(pick(after.value, 0, "createdAt"))), pick(after.value, 0, "createdAt")], [true, pick(stored.value, 0, "createdAt") ?? null]),
    ]);
    const incomplete = await api(running, "new task without a title", "POST", "/tasks/new", { token: user.token, body: JSON.stringify({ description: "no title" }) });
    context.expect(incomplete.folder, [same("a task without a title is a 400", incomplete.status, "400")]);
    const removed = await api(running, "delete", "DELETE", `/tasks/delete?id=${id}`, { token: user.token });
    const gone = await mongo(running, "mongosh reads the tasks after the delete", `${TASKS}.find().toArray()`);
    const missing = await api(running, "get after the delete", "GET", `/tasks/get?id=${id}`, { token: user.token });
    context.expect(missing.folder, [
      same("the delete answers 200", removed.status, "200"),
      same("the database holds no task any more", count(gone.value), 0),
      same("the deleted task is a 404", missing.status, "404"),
    ]);
  },
};

const tasksOwnership: Journey = {
  title: "one user cannot list, read, edit or delete another user's task, and every route refuses a request without a valid token",
  entryPoint: "`curl` against the `/tasks` routes with two users' tokens, no token and a forged one",
  async run(context) {
    const running = await startProject(context);
    const owner = await signIn(running, freshEmail("owner"));
    const other = await signIn(running, freshEmail("other"));
    const created = await api(running, "owner creates a task", "POST", "/tasks/new", { token: owner.token, body: JSON.stringify({ title: "Private", description: "mine" }) });
    const id = text(pick(bodyOf(created), 0));
    context.expect(created.folder, [same("the owner's creation answers 200", [created.status, id !== ""], ["200", true])], { critical: true });
    const listed = await api(running, "other lists", "GET", "/tasks/list", { token: other.token });
    const read = await api(running, "other reads", "GET", `/tasks/get?id=${id}`, { token: other.token });
    const edited = await api(running, "other edits", "PUT", `/tasks/edit?id=${id}`, { token: other.token, body: JSON.stringify({ title: "Hijacked" }) });
    const removed = await api(running, "other deletes", "DELETE", `/tasks/delete?id=${id}`, { token: other.token });
    context.expect(removed.folder, [
      same("the other user's list is empty", [listed.status, pick(bodyOf(listed), "total")], ["200", 0]),
      same("reading another user's task is a 404, as for a missing one", read.status, "404"),
      same("editing another user's task is a 404", edited.status, "404"),
      same("deleting another user's task answers 200 and skips it", removed.status, "200"),
    ]);
    const stored = await mongo(running, "mongosh reads the tasks", `${TASKS}.find().toArray()`);
    context.expect(stored.folder, [same("the task is untouched in the database", [count(stored.value), pick(stored.value, 0, "title"), pick(stored.value, 0, "userId")], [1, "Private", owner.id])]);
    const routes: [string, string, string, string?][] = [
      ["list", "GET", "/tasks/list"],
      ["get", "GET", `/tasks/get?id=${id}`],
      ["new", "POST", "/tasks/new", JSON.stringify({ title: "x" })],
      ["edit", "PUT", `/tasks/edit?id=${id}`, JSON.stringify({ title: "x" })],
      ["delete", "DELETE", `/tasks/delete?id=${id}`],
    ];
    for (const [name, method, path, body] of routes) {
      const bare: Send = {};
      if (body !== undefined) bare.body = body;
      const anonymous = await api(running, `${name} without a token`, method, path, bare);
      const withToken: Send = { token: "not.a.token" };
      if (body !== undefined) withToken.body = body;
      const forged = await api(running, `${name} with a forged token`, method, path, withToken);
      context.expect(forged.folder, [same(`${name} without a token is a 401`, anonymous.status, "401"), same(`${name} with a forged token is refused`, refusedAccess(forged), true)]);
    }
    const still = await mongo(running, "mongosh reads the tasks after the refused requests", `${TASKS}.find().toArray()`);
    context.expect(still.folder, [same("the refused requests changed nothing", [count(still.value), pick(still.value, 0, "title")], [1, "Private"])]);
  },
};

export const taskJourneys = { "tasks-crud": tasksCrud, "tasks-ownership": tasksOwnership };
