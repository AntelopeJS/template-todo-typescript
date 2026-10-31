import { readFileSync } from "node:fs";
import { createServer, type AddressInfo, type Server } from "node:net";
import { join } from "node:path";

import { equal, exitIs, type App, type Check, type CommandResult, type JourneyContext } from "@antelopejs/tooling-configs/verify";

import { canonical, parseJson, pick, text, tuple, type Json } from "./json.ts";

export { pick, text, tuple, type Json } from "./json.ts";

export const TEMPLATE = "Todo App Typescript";
export const MODULE = "antelopejs-module";
const MONGO = "mongo";
const DATABASE = "todo";
const INTERFACES = "https://github.com/AntelopeJS/interfaces";

function isAddress(address: ReturnType<Server["address"]>): address is AddressInfo {
  return typeof address === "object" && address !== null;
}

/** A TCP port the kernel just handed out. */
export function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!isAddress(address)) {
        reject(new Error("the server did not bind a TCP port"));
        return;
      }
      server.close(() => resolve(address.port));
    });
  });
}

/** `equal` that ignores key order; an absent value, also inside an array, reads as `null`. */
export function same(name: string, actual: Json | undefined | (Json | undefined)[], expected: Json | undefined): Check {
  return equal(name, canonical(Array.isArray(actual) ? tuple(...actual) : actual), canonical(expected));
}

/** Creates the project from the template with `ajs project init`, as a user does, and installs its dependencies. */
export async function scaffolded(context: JourneyContext): Promise<string> {
  const project = join(context.work, "app");
  const init = await context.scaffold("ajs project init", project);
  context.expect(init.folder, [exitIs(init, 0)], { critical: true });
  context.tree("scaffolded tree", project);
  const install = await context.command("pnpm install", "pnpm", ["install", "--frozen-lockfile", "--prefer-offline"], { cwd: project });
  context.expect(install.folder, [exitIs(install, 0)], { critical: true });
  return project;
}

/** Points `ajs` at the public interfaces repository, then installs the modules the template's interfaces need, as the README says. */
export async function withModules(context: JourneyContext, project: string): Promise<void> {
  const git = await context.command("ajs config set git", "pnpm", ["exec", "ajs", "config", "set", "git", INTERFACES], { cwd: project });
  context.expect(git.folder, [exitIs(git, 0)], { critical: true });
  const modules = await context.command("ajs project modules install", "pnpm", ["exec", "ajs", "project", "modules", "install", "--yes"], { cwd: project });
  context.expect(modules.folder, [exitIs(modules, 0)], { critical: true });
}

export interface Running {
  context: JourneyContext;
  project: string;
  app: App;
  base: string;
}

/** Points the installed API module at a free port and the database module at the run's MongoDB container. */
function configure(context: JourneyContext, project: string, port: number): void {
  const mongo = context.service(MONGO);
  const file = join(project, "antelope.config.ts");
  const source = readFileSync(file, "utf8");
  const edited = source.replace("port: 8080", `port: ${port}`).replace("mongodb://localhost:27017", `mongodb://${mongo.host}:${mongo.port}`).replace('database: "antelopejs"', `database: "${DATABASE}"`);
  context.edit("point the API at a free port and the database at the run's MongoDB", file, edited);
}

async function waitForApi(context: JourneyContext, base: string): Promise<void> {
  let folder = "";
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const answer = await context.http("wait for the API", `${base}/tasks/list`);
    folder = answer.folder;
    if (answer.status === 401) return;
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  context.expect(folder, [{ name: "the API answered 401 to an unauthenticated list", pass: false, detail: base }], { critical: true });
}

/** Scaffolds the project, installs its modules, points them at free resources, starts `ajs project dev` and waits until the API answers. */
export async function startProject(context: JourneyContext): Promise<Running> {
  const project = await scaffolded(context);
  await withModules(context, project);
  const port = await freePort();
  configure(context, project, port);
  const app = await context.dev("ajs-project-dev", project, { env: { PORT: String(port) } });
  const base = `http://localhost:${port}`;
  await waitForApi(context, base);
  return { context, project, app, base };
}

/** What curl got back from the API. */
export interface Reply {
  folder: string;
  status: string;
  body: string;
}

function replyFrom(result: CommandResult, bodyFile: string): Reply {
  let body = "";
  try {
    body = readFileSync(bodyFile, "utf8");
  } catch {
    body = "";
  }
  return { folder: result.folder, status: result.stdout.trim(), body };
}

/** The JSON a reply body holds, or the text itself when it is not JSON. */
export function bodyOf(reply: Reply): Json {
  try {
    return parseJson(reply.body);
  } catch {
    return reply.body;
  }
}

export interface Send {
  token?: string;
  body?: string;
}

/** One request to the API through curl, as the README sends it: the token in `x-antelopejs-auth`, a JSON body given with `-d`. */
export async function api(running: Running, name: string, method: string, path: string, send: Send = {}): Promise<Reply> {
  const bodyFile = join(running.context.work, `${name.replace(/\W+/g, "-")}.out`);
  const args = ["-sS", "-o", bodyFile, "-w", "%{http_code}", "-X", method];
  if (send.token !== undefined) args.push("-H", `x-antelopejs-auth: ${send.token}`);
  if (send.body !== undefined) args.push("-d", send.body);
  args.push(`${running.base}${path}`);
  return replyFrom(await running.context.command(name, "curl", args), bodyFile);
}

/** Registers a user and logs in; returns the token and the user's id. */
export async function signIn(running: Running, email: string, password = "secret"): Promise<{ token: string; id: string }> {
  const credentials = JSON.stringify({ email, password });
  const registered = await api(running, `register ${email}`, "POST", "/auth/register", { body: credentials });
  running.context.expect(registered.folder, [same("registration is accepted", registered.status, "200")], { critical: true });
  const login = await api(running, `login ${email}`, "POST", "/auth/login", { body: credentials });
  const token = text(pick(bodyOf(login), "token"));
  running.context.expect(login.folder, [same("login answers 200 with a token", [login.status, token !== ""], ["200", true])], { critical: true });
  return { token, id: text(pick(bodyOf(login), "user", "id")) };
}

/** Reads the database as MongoDB's own shell sees it: `expression` runs against the run's `todo` database and its JSON is returned. */
export async function mongo(running: Running, name: string, expression: string): Promise<{ folder: string; value: Json }> {
  const read = await running.context.native(name, MONGO, ["mongosh", "--quiet", "--eval", `JSON.stringify(${expression})`, DATABASE]);
  let value: Json = null;
  try {
    value = parseJson(read.stdout.trim());
  } catch {
    value = read.stdout.trim();
  }
  return { folder: read.folder, value };
}

/** A fresh email address, unique within the process. */
let counter = 0;
export function freshEmail(prefix: string): string {
  counter += 1;
  return `${prefix}-${process.pid}-${counter}@example.com`;
}

/** How many items a JSON array holds, or -1 when the value is not an array. */
export function count(value: Json | undefined): number {
  return Array.isArray(value) ? value.length : -1;
}

/** Whether a reply refused the request as unauthenticated or forbidden. */
export function refusedAccess(reply: Reply): boolean {
  return reply.status === "401" || reply.status === "403";
}

/** Parses JSON text read from a file the template scaffolded. */
export function parseJsonText(content: string): Json {
  return parseJson(content);
}
