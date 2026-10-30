import assert from "node:assert";
import { readList, readLogin, request, type Credentials } from "./api.ts";

describe("todo API", () => {
  const credentials: Credentials = {
    email: "test@example.com",
    password: "password",
  };
  let token: string;

  before(async () => {
    const register = await request(
      "POST",
      "/auth/register",
      undefined,
      credentials,
    );
    assert.ok(register.ok, `POST /auth/register returned ${register.status}`);
    const login = await request("POST", "/auth/login", undefined, credentials);
    assert.strictEqual(login.status, 200);
    ({ token } = await readLogin(login));
  });

  it("rejects task requests without a token", async () => {
    const response = await request("GET", "/tasks/list");
    assert.strictEqual(response.status, 401);
  });

  it("rejects a task body that is not a JSON object", async () => {
    const response = await request("POST", "/tasks/new", token, null);
    assert.strictEqual(response.status, 400);
  });

  it("creates and lists tasks", async () => {
    const created = await request("POST", "/tasks/new", token, {
      title: "Write tests",
      description: "Cover the todo API",
    });
    assert.ok(created.ok, `POST /tasks/new returned ${created.status}`);

    const list = await request("GET", "/tasks/list", token);
    assert.strictEqual(list.status, 200);
    const { results } = await readList(list);
    assert.deepStrictEqual(
      results.map((task) => task.title),
      ["Write tests"],
    );
  });
});
