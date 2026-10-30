import assert from "node:assert";

/** Address of the API that the `antelope.test.ts` setup serves for this suite. */
const API_URL = process.env.TEST_API_URL;

/** The email and password of a registration or login body. */
export interface Credentials {
  email: string;
  password: string;
}

/** The task fields a `new` or `edit` body can carry. */
export interface TaskFields {
  title?: string;
  description?: string;
  userId?: string;
}

/** A task as the `get` and `list` routes answer it. */
export interface TaskView {
  title: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

/** A successful `POST /auth/login` answer. */
export interface LoginView {
  token: string;
  user: { id: string };
}

/** A `GET /tasks/list` answer. */
export interface ListView {
  results: TaskView[];
  total: number;
}

function isObject(value: unknown): value is object {
  return typeof value === "object" && value !== null;
}

function isTaskView(value: unknown): value is TaskView {
  return (
    isObject(value) &&
    "title" in value &&
    typeof value.title === "string" &&
    "userId" in value &&
    typeof value.userId === "string" &&
    "createdAt" in value &&
    typeof value.createdAt === "string" &&
    "updatedAt" in value &&
    typeof value.updatedAt === "string"
  );
}

function isLoginView(value: unknown): value is LoginView {
  return (
    isObject(value) &&
    "token" in value &&
    typeof value.token === "string" &&
    "user" in value &&
    isObject(value.user) &&
    "id" in value.user &&
    typeof value.user.id === "string"
  );
}

function isListView(value: unknown): value is ListView {
  return (
    isObject(value) &&
    "results" in value &&
    Array.isArray(value.results) &&
    value.results.every(isTaskView) &&
    "total" in value &&
    typeof value.total === "number"
  );
}

function isText(value: unknown): value is string {
  return typeof value === "string";
}

function isTextList(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(isText);
}

/** Sends a request to the API, with the token in the auth header when there is one. */
export function request(
  method: string,
  path: string,
  token?: string,
  body?: Credentials | TaskFields | null,
): Promise<Response> {
  return fetch(`${API_URL}${path}`, {
    method,
    headers: token ? { "x-antelopejs-auth": token } : {},
    ...(body !== undefined && { body: JSON.stringify(body) }),
  });
}

async function readAs<Answer>(
  response: Response,
  isAnswer: (value: unknown) => value is Answer,
): Promise<Answer> {
  const body: unknown = await response.json();
  assert.ok(isAnswer(body), `${response.url} answered ${JSON.stringify(body)}`);
  return body;
}

/** The answer of a login that succeeded. */
export function readLogin(response: Response): Promise<LoginView> {
  return readAs(response, isLoginView);
}

/** The answer of `GET /tasks/get`. */
export function readTask(response: Response): Promise<TaskView> {
  return readAs(response, isTaskView);
}

/** The answer of `GET /tasks/list`. */
export function readList(response: Response): Promise<ListView> {
  return readAs(response, isListView);
}

/** The ids `POST /tasks/new` answers. */
export function readIds(response: Response): Promise<string[]> {
  return readAs(response, isTextList);
}
