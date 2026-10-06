# AntelopeJS Todo App Template

<div align="center">
<a href="./LICENSE"><img alt="License" src="https://img.shields.io/badge/License-Apache_2.0-blue.svg?style=for-the-badge&labelColor=000000"></a>
<a href="https://discord.gg/sjK28QHrA7"><img src="https://img.shields.io/badge/Discord-18181B?logo=discord&style=for-the-badge&color=000000" alt="Discord"></a>
</div>

A full-featured sample application demonstrating core AntelopeJS patterns: database models with decorators, JWT authentication, RESTful controllers, and automatic CRUD generation.

## Quick start

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Start development mode:

   ```bash
   pnpm run dev
   ```

> **Note:** The `antelope.config.ts` file defines the required modules (API server, MongoDB, auth-jwt, etc.) and their configuration. Adjust connection strings and secrets before running.

## Application structure

```
src/
├── index.ts              # Entry point — initializes the database schema
├── db/
│   ├── tables/           # Table definitions with decorators
│   │   ├── user.table.ts
│   │   └── task.table.ts
│   └── models/           # Data models with business logic
│       ├── user.model.ts
│       └── task.model.ts
├── routes/
│   └── auth.ts           # Authentication controller
└── data-api/
    └── tasks.ts          # Auto-generated CRUD controller
test/
└── example.test.ts       # Sample test of the todo API
antelope.config.ts        # AntelopeJS project configuration
antelope.test.ts          # Test configuration
```

## Included components

### Database tables

The `User` table uses the `HashModifier` mixin to automatically hash passwords via the `@Hashed` decorator. The `Task` table stores tasks linked to a user through a `userId` index.

### Data models

`UserModel` and `TaskModel` extend `BasicDataModel` to provide typed access to the database. Each model adds custom query methods like `getUserByEmail` and `getTasksByUserId`.

### Authentication

The `AuthController` handles registration, login, and profile retrieval. Passwords are automatically hashed on insert and compared transparently on login. The `SignRaw` function generates JWT tokens, and the `@Authentication` decorator protects routes.

### Task management API

The `TaskDataAPI` controller extends `DataController` to generate CRUD endpoints automatically. All routes require authentication through a custom route definition that prepends the `@Authentication` decorator.

## API endpoints

### Authentication

| Method | Endpoint         | Description                |
| ------ | ---------------- | -------------------------- |
| POST   | `/auth/register` | Register a new user        |
| POST   | `/auth/login`    | Login and receive a JWT    |
| GET    | `/auth/me`       | Get the authenticated user |

### Task management

All task endpoints require a valid JWT token.

| Method | Endpoint      | Description         |
| ------ | ------------- | ------------------- |
| GET    | `/tasks`      | List all tasks      |
| GET    | `/tasks/:id`  | Get a specific task |
| POST   | `/tasks`      | Create a new task   |
| PUT    | `/tasks/:id`  | Update a task       |
| DELETE | `/tasks/:id`  | Delete a task       |

## Tests

`antelope.test.ts` is the test configuration that `antelopeJs.test` points to in `package.json`. It builds the module with `tsc` and starts it with the modules that implement its interfaces: `@antelopejs/api`, `@antelopejs/auth-jwt` and `@antelopejs/mongodb`. The data API and the database decorators need no module: `@antelopejs/interface-data-api` and `@antelopejs/interface-database-decorators` implement them. `ajs module test` then runs the `*.test.ts` files of the `test/` folder with Mocha:

```bash
pnpm test
```

The tests need no running service. Before the modules start, the configuration:

- starts a throwaway MongoDB server with [`mongodb-memory-server-core`](https://github.com/typegoose/mongodb-memory-server) and stops it after the tests;
- serves the API on a free port of `127.0.0.1` and sets its address in the `TEST_API_URL` environment variable, which `test/example.test.ts` uses to call the routes of the module.

The first run downloads a MongoDB server binary (about 120 MB) and caches it in `~/.cache/mongodb-binaries` for the next runs. To use a `mongod` that is already installed instead, set `MONGOMS_SYSTEM_BINARY` to its path.

If you rename the module, rename it in `antelope.test.ts` too. Type annotations in the `.ts` test files rely on the type stripping of Node.js, enabled by default from Node.js 22.18.

## Learn more

For a detailed walkthrough of this template, see the [Full-Stack App Tutorial](https://antelopejs.com/docs/guides/full-stack-app-tutorial) in the AntelopeJS documentation, and [Testing](https://antelopejs.com/docs/module-development/testing) to write module tests.
