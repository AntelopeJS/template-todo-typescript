import assert from "node:assert";

/** Address of the API that the `antelope.test.ts` setup serves for this suite. */
const API_URL = process.env.TEST_API_URL;

/** Id that names no task. */
const MISSING_ID = "00000000-0000-0000-0000-000000000000";

function request(method, path, token, body?) {
  return fetch(`${API_URL}${path}`, {
    method,
    headers: token ? { "x-antelopejs-auth": token } : {},
    ...(body && { body: JSON.stringify(body) }),
  });
}

async function signIn(email) {
  const credentials = { email, password: "password" };
  const register = await request(
    "POST",
    "/auth/register",
    undefined,
    credentials,
  );
  assert.ok(register.ok, `POST /auth/register returned ${register.status}`);
  const login = await request("POST", "/auth/login", undefined, credentials);
  assert.strictEqual(login.status, 200);
  const { token, user } = await login.json();
  return { token, userId: user.id };
}

async function createTask(token, body) {
  const created = await request("POST", "/tasks/new", token, body);
  assert.strictEqual(created.status, 200);
  const [id] = await created.json();
  return id;
}

async function getTask(token, id) {
  const response = await request("GET", `/tasks/get?id=${id}`, token);
  assert.strictEqual(response.status, 200);
  return response.json();
}

async function answer(response) {
  return { status: response.status, body: await response.text() };
}

function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

describe("task ownership", () => {
  let alice;
  let bob;

  before(async () => {
    alice = await signIn("alice@example.com");
    bob = await signIn("bob@example.com");
  });

  it("sets the owner from the token and ignores a forged userId", async () => {
    const id = await createTask(alice.token, {
      title: "mine",
      description: "d",
      userId: bob.userId,
    });

    const task = await getTask(alice.token, id);
    assert.strictEqual(task.userId, alice.userId);
  });

  it("sets createdAt and updatedAt on new, and refreshes only updatedAt on edit", async () => {
    const before = Date.now();
    const id = await createTask(alice.token, { title: "dated" });
    const created = await getTask(alice.token, id);
    const createdAt = Date.parse(created.createdAt);
    assert.ok(createdAt >= before, `createdAt is ${created.createdAt}`);
    assert.strictEqual(Date.parse(created.updatedAt), createdAt);

    await wait(10);
    const edit = await request("PUT", `/tasks/edit?id=${id}`, alice.token, {
      title: "dated, edited",
    });
    assert.strictEqual(edit.status, 200);

    const edited = await getTask(alice.token, id);
    assert.strictEqual(edited.title, "dated, edited");
    assert.strictEqual(Date.parse(edited.createdAt), createdAt);
    assert.ok(
      Date.parse(edited.updatedAt) > createdAt,
      `updatedAt is ${edited.updatedAt}, createdAt is ${created.createdAt}`,
    );
  });

  it("keeps the owner when an edit sends another userId", async () => {
    const id = await createTask(alice.token, { title: "kept" });

    const edit = await request("PUT", `/tasks/edit?id=${id}`, alice.token, {
      title: "kept",
      userId: bob.userId,
    });
    assert.strictEqual(edit.status, 200);

    const task = await getTask(alice.token, id);
    assert.strictEqual(task.userId, alice.userId);
  });

  it("lists only the caller's tasks, whatever userId filter the query sends", async () => {
    await createTask(alice.token, { title: "alice's list task" });
    await createTask(bob.token, { title: "bob's list task" });

    for (const query of ["", `?filter_userId=${alice.userId}`]) {
      const list = await request("GET", `/tasks/list${query}`, bob.token);
      assert.strictEqual(list.status, 200);
      const { results, total } = await list.json();
      assert.deepStrictEqual(
        results.map((task) => [task.title, task.userId]),
        [["bob's list task", bob.userId]],
        `GET /tasks/list${query}`,
      );
      assert.strictEqual(total, 1);
    }
  });

  it("answers a get of another user's task as it answers a missing task", async () => {
    const id = await createTask(alice.token, { title: "private" });

    const foreign = await answer(
      await request("GET", `/tasks/get?id=${id}`, bob.token),
    );
    const missing = await answer(
      await request("GET", `/tasks/get?id=${MISSING_ID}`, bob.token),
    );
    assert.deepStrictEqual(foreign, missing);
    assert.strictEqual(foreign.status, 404);
  });

  it("answers an edit of another user's task with 404 and leaves it unchanged", async () => {
    const id = await createTask(alice.token, { title: "untouched" });

    const foreign = await answer(
      await request("PUT", `/tasks/edit?id=${id}`, bob.token, {
        title: "taken over",
      }),
    );
    const missing = await answer(
      await request("PUT", `/tasks/edit?id=${MISSING_ID}`, bob.token, {
        title: "taken over",
      }),
    );
    assert.deepStrictEqual(foreign, missing);
    assert.strictEqual(foreign.status, 404);

    const task = await getTask(alice.token, id);
    assert.strictEqual(task.title, "untouched");
  });

  it("answers a delete of another user's task as it answers a missing task and keeps it", async () => {
    const id = await createTask(alice.token, { title: "kept alive" });

    const foreign = await answer(
      await request("DELETE", `/tasks/delete?id=${id}`, bob.token),
    );
    const missing = await answer(
      await request("DELETE", `/tasks/delete?id=${MISSING_ID}`, bob.token),
    );
    assert.deepStrictEqual(foreign, missing);

    const task = await getTask(alice.token, id);
    assert.strictEqual(task.title, "kept alive");
  });

  it("deletes only the caller's tasks among the ids of one request", async () => {
    const own = await createTask(bob.token, { title: "bob's to delete" });
    const foreign = await createTask(alice.token, { title: "alice's to keep" });

    const removed = await request(
      "DELETE",
      `/tasks/delete?id=${own}&id=${foreign}`,
      bob.token,
    );
    assert.strictEqual(removed.status, 200);

    const gone = await request("GET", `/tasks/get?id=${own}`, bob.token);
    assert.strictEqual(gone.status, 404);
    const kept = await getTask(alice.token, foreign);
    assert.strictEqual(kept.title, "alice's to keep");
  });
});
