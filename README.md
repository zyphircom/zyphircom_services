# Zyphircom

NestJS monorepo containing an API service for scheduling and managing jobs, and a worker service for processing queued tasks using BullMQ and Redis.

## Architecture

This project consists of two independent services:

- **API Service** - REST API for scheduling HTTP requests with cron expressions, managing tasks, and user authentication
- **Worker Service** - Background processor that executes scheduled jobs, performs HTTP requests, and logs results

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│   API       │──────▶│   Redis     │◀──────│   Worker    │
│  (NestJS)   │       │  (BullMQ)   │       │  (NestJS)   │
└─────────────┘       └─────────────┘       └─────────────┘
       │                                            │
       └────────────────┬───────────────────────────┘
                        ▼
                 ┌─────────────┐
                 │ PostgreSQL  │
                 │  Database   │
                 └─────────────┘
```

## Quick Start

### Prerequisites

- Node.js (v18 or higher)
- pnpm (package manager)
- Docker & Docker Compose

### Setup

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd zyphircom_api
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Configure environment variables**

   ```bash
   cp .env.example .env
   ```

   Update the `.env` file with your configuration (see `.env.example` for reference)

4. **Start infrastructure services**

   ```bash
   docker-compose up -d
   ```

   This starts PostgreSQL and Redis containers

5. **Run database migrations**

   ```bash
   pnpm db:migrate
   ```

6. **Start the services**

   Run both services in development mode:

   ```bash
   # Terminal 1 - Start API
   pnpm start:api:dev

   # Terminal 2 - Start Worker
   pnpm start:worker:dev
   ```

   The API will be available at `http://localhost:3333`

## Project Structure

```
zyphircom_api/
├── apps/
│   ├── api/              # REST API service
│   │   ├── src/
│   │   └── README.md     # API-specific documentation
│   └── worker/           # Background job processor
│       ├── src/
│       └── README.md     # Worker-specific documentation
├── lib/                  # Shared libraries
│   ├── config/          # Environment configuration
│   ├── drizzle/         # Database ORM and schema
│   └── logger/          # Logging utilities
├── drizzle/             # Database migrations
├── docker-compose.yaml  # Local development infrastructure
└── .env.example         # Environment variables template
```

## Available Scripts

### Development

- `pnpm start:api:dev` - Start API in watch mode
- `pnpm start:worker:dev` - Start Worker in watch mode

### Build

- `pnpm build:api` - Build API service
- `pnpm build:worker` - Build Worker service

### Production

- `pnpm start:prod:api` - Start API in production mode
- `pnpm start:prod:worker` - Start Worker in production mode

### Database

- `pnpm db:generate` - Generate migration files
- `pnpm db:push` - Push schema changes to database
- `pnpm db:studio` - Open Drizzle Studio (database GUI)

### Code Quality

- `pnpm format` - Format code with Prettier
- `pnpm lint` - Lint and fix code with ESLint

## Services Documentation

For detailed information about each service:

- **[API Documentation](apps/api/README.md)** - Endpoints, authentication, task management
- **[Worker Documentation](apps/worker/README.md)** - Job processing, retry logic, logging

## Tech Stack

- **Framework**: NestJS (TypeScript)
- **Database**: PostgreSQL with Drizzle ORM
- **Queue**: BullMQ with Redis
- **Authentication**: JWT
- **Validation**: class-validator, Zod

## Environment Configuration

When adding new environment variables:

1. Add them to `.env.example`
2. Update the schema in `lib/config/validation.ts`
3. Optionally add getters in `lib/config/env.config.ts` for type-safe access

## Development Workflow

1. Make changes to the code
2. The services will auto-reload in development mode
3. Run `pnpm lint` before committing
4. Ensure both services are running for full functionality
