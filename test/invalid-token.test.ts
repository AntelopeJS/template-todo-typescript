import assert from "node:assert";
import { createHmac } from "node:crypto";
import { request } from "./api.ts";

const PROTECTED_ROUTES: Array<[string, string]> = [
  ["GET", "/auth/me"],
  ["GET", "/tasks/list"],
  ["GET", "/tasks/get?id=missing"],
  ["POST", "/tasks/new"],
  ["PUT", "/tasks/edit?id=missing"],
  ["DELETE", "/tasks/delete?id=missing"],
];

function base64url(value: string) {
  return Buffer.from(value).toString("base64url");
}

/** An HS256 JWT for a made-up user, signed with a secret the server does not hold. */
function forgedToken() {
  const header = base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = base64url(
    JSON.stringify({ userId: "forged", email: "forged@example.com" }),
  );
  const signature = createHmac("sha256", "not-the-server-secret")
    .update(`${header}.${payload}`)
    .digest("base64url");
  return `${header}.${payload}.${signature}`;
}

const INVALID_TOKENS: Array<[string, string]> = [
  ["a token that is not a JWT", "not.a.token"],
  ["a JWT signed with another secret", forgedToken()],
];

describe("protected routes", () => {
  for (const [method, path] of PROTECTED_ROUTES) {
    it(`answers 401 to ${method} ${path} without a token`, async () => {
      const response = await request(method, path);
      assert.strictEqual(response.status, 401);
    });

    for (const [name, token] of INVALID_TOKENS) {
      it(`answers 403 to ${method} ${path} with ${name}`, async () => {
        const response = await request(method, path, token);
        assert.strictEqual(response.status, 403);
      });
    }
  }
});
