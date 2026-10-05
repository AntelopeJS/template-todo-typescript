import { createServer } from 'node:net';
import { defineConfig } from '@antelopejs/interface-core/config';
import { MongoMemoryServer } from 'mongodb-memory-server-core';

let mongod: MongoMemoryServer | undefined;

function findFreePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address() as { port: number };
      server.close(() => resolve(port));
    });
  });
}

export default defineConfig({
  name: 'antelopejs-module-test',
  modules: {
    'antelopejs-module': {
      source: {
        type: 'local',
        path: '.',
        installCommand: ['npx tsc'],
      },
    },
    api: {
      source: { type: 'package', package: '@antelopejs/api', version: '^1.3.3' },
    },
    'auth-jwt': {
      source: { type: 'package', package: '@antelopejs/auth-jwt', version: '^1.0.3' },
      config: { secret: 'test-secret' },
    },
    'data-api': {
      source: { type: 'package', package: '@antelopejs/data-api', version: '^1.1.1' },
    },
    'database-decorators': {
      source: { type: 'package', package: '@antelopejs/database-decorators', version: '^1.1.1' },
    },
    mongodb: {
      source: { type: 'package', package: '@antelopejs/mongodb', version: '^1.4.1' },
    },
  },
  test: {
    folder: 'test',
    // Serve the API on a free port, start a throwaway MongoDB server and point the modules to them.
    async setup() {
      const port = await findFreePort();
      const apiUrl = `http://127.0.0.1:${port}`;
      process.env.TEST_API_URL = apiUrl;
      mongod = await MongoMemoryServer.create();
      return {
        modules: {
          api: {
            config: { publicBaseUrl: apiUrl, servers: [{ protocol: 'http', host: '127.0.0.1', port }] },
          },
          mongodb: {
            config: { url: mongod.getUri(), database: 'antelopejs_test' },
          },
        },
      };
    },
    async cleanup() {
      await mongod?.stop();
    },
  },
});
