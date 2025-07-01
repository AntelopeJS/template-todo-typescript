# AntelopeJS TypeScript Sample Template

This repository contains a complete TypeScript application demonstrating the core features of AntelopeJS including authentication, data management, and RESTful APIs.

## Features

- TypeScript-based application structure
- Database models with decorators for table definitions
- User authentication with JWT tokens
- Data models with business logic
- RESTful API endpoints
- Automatic CRUD operations with Data API

## Application Structure

```
src/
├── index.ts            // Application entry point
├── db/                 // Database layer
│   ├── tables/         // Table definitions
│   ├── models/         // Data models with business logic
├── routes/             // API routes and controllers
└── data-api/           // Data API controllers
```

## Included Components

### Database Tables

- User table with authentication fields
- Task table with relationship to users

### Data Models

- UserModel with login/registration methods
- TaskModel with CRUD operations

### Authentication

- User registration endpoint
- Login endpoint with JWT token generation
- Protected profile endpoint

### Task Management API

- Automatically generated CRUD endpoints
- Authentication protection

## Available Endpoints

### Authentication Endpoints

- `POST /auth/register` - Register a new user
- `POST /auth/login` - Login and get a JWT token
- `GET /auth/me` - Get current user profile (requires authentication)

### Task Management Endpoints

- `GET /tasks` - List all tasks (requires authentication)
- `GET /tasks/:id` - Get a specific task (requires authentication)
- `POST /tasks` - Create a new task (requires authentication)
- `PUT /tasks/:id` - Update a task (requires authentication)
- `DELETE /tasks/:id` - Delete a task (requires authentication)

## Getting Started

1. Initialize a new AntelopeJS project

```bash
ajs project init my-project-name
```

2. When prompted if you have an app module, select "yes"

3. Install dependencies

```bash
ajs project modules install
```

4. Run your project

```bash
ajs project run
# Or with watch mode for development
ajs project run -w
```

## Learn More

For a detailed walkthrough of how this template works, check out the [Full-Stack App Tutorial](https://antelopejs.com/docs/guides/full-stack-app-tutorial) in the AntelopeJS documentation.
