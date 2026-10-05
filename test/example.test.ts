import assert from 'node:assert';

// antelope.test.ts builds and starts this module with the modules it depends on,
// and sets the address of the API.
const API_URL = process.env.TEST_API_URL;

function request(method, path, token, body) {
  return fetch(`${API_URL}${path}`, {
    method,
    headers: token ? { 'x-antelopejs-auth': token } : {},
    body: body && JSON.stringify(body),
  });
}

describe('todo API', () => {
  const credentials = { email: 'test@example.com', password: 'password' };
  let token;

  before(async () => {
    const register = await request('POST', '/auth/register', undefined, credentials);
    assert.ok(register.ok, `POST /auth/register returned ${register.status}`);
    const login = await request('POST', '/auth/login', undefined, credentials);
    assert.strictEqual(login.status, 200);
    ({ token } = await login.json());
  });

  it('rejects task requests without a token', async () => {
    const response = await request('GET', '/tasks/list');
    assert.strictEqual(response.status, 401);
  });

  it('creates and lists tasks', async () => {
    const created = await request('POST', '/tasks/new', token, { title: 'Write tests', description: 'Cover the todo API' });
    assert.ok(created.ok, `POST /tasks/new returned ${created.status}`);

    const list = await request('GET', '/tasks/list', token);
    assert.strictEqual(list.status, 200);
    const { results } = await list.json();
    assert.deepStrictEqual(
      results.map((task) => task.title),
      ['Write tests'],
    );
  });
});
