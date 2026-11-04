import assert from "node:assert";
import { request, requestText, type Credentials } from "./api.ts";

const NOT_CREDENTIALS: Array<[string, string]> = [
  ["null", "null"],
  ["an array", "[]"],
  ["a string", '"secret1"'],
  ["text that is not JSON", "not json"],
  ["a numeric email", '{"email":5,"password":"secret1"}'],
  ["a numeric password", '{"email":"numeric@example.com","password":123456}'],
  ["a null password", '{"email":"null@example.com","password":null}'],
];

describe("auth bodies", () => {
  const credentials: Credentials = {
    email: "body@example.com",
    password: "secret1",
  };

  before(async () => {
    const register = await request(
      "POST",
      "/auth/register",
      undefined,
      credentials,
    );
    assert.strictEqual(register.status, 200);
  });

  for (const [name, body] of NOT_CREDENTIALS) {
    it(`answers 400 to a register body that is ${name}`, async () => {
      const response = await requestText("POST", "/auth/register", body);
      assert.strictEqual(response.status, 400);
    });

    it(`answers 400 to a login body that is ${name}`, async () => {
      const response = await requestText("POST", "/auth/login", body);
      assert.strictEqual(response.status, 400);
    });
  }

  it("keeps answering 400 for a missing, empty or short field", async () => {
    for (const body of [
      {},
      { email: "body@example.com" },
      { email: "", password: "secret1" },
    ]) {
      const response = await requestText(
        "POST",
        "/auth/login",
        JSON.stringify(body),
      );
      assert.strictEqual(response.status, 400);
    }
    const short = await request("POST", "/auth/register", undefined, {
      email: "short@example.com",
      password: "12345",
    });
    assert.strictEqual(short.status, 400);
  });

  it("keeps answering 409 for a taken email and 401 for a wrong password", async () => {
    const taken = await request(
      "POST",
      "/auth/register",
      undefined,
      credentials,
    );
    assert.strictEqual(taken.status, 409);
    const wrong = await request("POST", "/auth/login", undefined, {
      email: credentials.email,
      password: "wrong-password",
    });
    assert.strictEqual(wrong.status, 401);
  });
});
