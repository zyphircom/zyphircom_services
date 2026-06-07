# Zyphircom API

A NestJS-based REST API service for scheduling and managing HTTP requests using cron expressions. This service allows users to create, manage, and monitor recurring HTTP tasks with built-in logging and authentication.

## Features

- 🔐 **JWT Authentication** - Secure user registration and login
- ⏰ **Cron-based Scheduling** - Schedule HTTP requests using cron expressions
- 📊 **Task Management** - Full CRUD operations for scheduled tasks
- 📝 **Execution Logging** - Track task execution history and responses
- 🔄 **Automatic Retries** - Exponential backoff retry mechanism for failed tasks
- 🐳 **Docker Support** - Easy local development setup with Docker Compose

## Tech Stack

- **Framework**: NestJS (TypeScript)
- **Database**: PostgreSQL with Drizzle ORM
- **Queue**: BullMQ with Redis
- **Authentication**: JWT
- **Validation**: class-validator, Zod

## Prerequisites

- Node.js (v18 or higher)
- pnpm (package manager)
- Docker & Docker Compose (for local development)
- PostgreSQL (if not using Docker)
- Redis (if not using Docker)

## API Endpoints

### Authentication

| Method | Endpoint           | Description                 |
| ------ | ------------------ | --------------------------- |
| POST   | `/api/auth/signup` | Register a new user         |
| POST   | `/api/auth/login`  | Login and receive JWT token |

**Example Signup Request:**

```json
{
  "email": "user@example.com",
  "password": "yourpassword"
}
```

### Tasks (Requires Authentication)

| Method | Endpoint             | Description                    |
| ------ | -------------------- | ------------------------------ |
| POST   | `/api/task`          | Create a new scheduled task    |
| GET    | `/api/task`          | Get all tasks for current user |
| PATCH  | `/api/task/:id`      | Update a task                  |
| DELETE | `/api/task/:id`      | Delete a task                  |
| GET    | `/api/task/:id/logs` | Get execution logs for a task  |

**Example Create Task Request:**

```json
{
  "targetUrl": "https://api.example.com/webhook",
  "cron": "0 */2 * * *",
  "payload": "{\"message\": \"Hello World\"}"
}
```

**Authentication Header:**

```
Authorization: Bearer <your-jwt-token>
```

## How It Works

1. **User Registration**: Create an account via `/auth/signup`
2. **Authentication**: Login via `/auth/login` to receive a JWT token
3. **Create Task**: Schedule an HTTP request with a cron expression
4. **Task Execution**: BullMQ processes tasks according to their schedule
5. **Logging**: Each execution is logged with status, response, and metadata
6. **Task Management**: Update or delete tasks as needed

## Key Concepts

### Cron Expressions

Tasks use standard cron syntax for scheduling:

- `0 * * * *` - Every hour
- `*/5 * * * *` - Every 5 minutes
- `0 9 * * 1-5` - Every weekday at 9 AM

### Task Retry Logic

- Failed tasks retry up to 5 times
- Exponential backoff with 5-second initial delay
- Completed/failed jobs are automatically cleaned up

### Security

- All task endpoints require JWT authentication
- Users can only access their own tasks
- Passwords are hashed with bcrypt

## Environment Notes

- Update `./lib/config/validation.ts` when adding new environment variables
- The validation schema ensures all required variables are present at startup
- Invalid configuration will prevent the application from starting
