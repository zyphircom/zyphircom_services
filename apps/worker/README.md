# Zyphircom Worker

A NestJS-based background worker service that processes scheduled jobs from Redis queue, executes HTTP requests, and logs execution results to the database.

## Features

- 🔄 **Job Processing** - Consumes jobs from BullMQ queue and executes HTTP requests
- 🔁 **Automatic Retries** - Exponential backoff retry mechanism for failed requests
- 📝 **Execution Logging** - Detailed logging of all job executions (success and failure)
- ⏱️ **Timeout Handling** - 10-second timeout for HTTP requests
- 🎯 **Event Monitoring** - Real-time job completion and failure tracking

## Tech Stack

- **Framework**: NestJS (TypeScript)
- **Queue**: BullMQ with Redis
- **Database**: PostgreSQL with Drizzle ORM
- **HTTP Client**: Axios

## How It Works

### Job Lifecycle

1. **Job Consumption** - Worker connects to Redis and listens for jobs on the queue
2. **HTTP Execution** - Processes each job by making an HTTP POST request to the target URL
3. **Response Handling** - Captures response status, headers, and body
4. **Database Logging** - Stores execution details in `taskLogsTable` including:
   - Success/failure status
   - Response code and body (truncated to 5000 chars)
   - Start and completion timestamps
   - Attempt number and retry flag
5. **Retry Logic** - On failure, BullMQ automatically retries according to the configured strategy

### Job Data Structure

Each job received from the queue contains:

```typescript
{
  taskId: string,      // Database task ID for logging
  targetUrl: string,   // URL to send the HTTP request to
  payload: any,        // Request body data
}
```

### Retry Configuration

Jobs are configured with the following retry behavior (set by the API service):

- **Max Attempts**: 5
- **Backoff Strategy**: Exponential
- **Initial Delay**: 5 seconds
- **Pattern**: Delays increase exponentially (5s, 25s, 125s, etc.)

### Logging Behavior

Every job execution is logged to the database with:

- ✅ **Success logs** - HTTP status 2xx responses
- ❌ **Failure logs** - Network errors, timeouts, non-2xx responses
- 🔄 **Retry indicator** - Tracks whether execution is a retry attempt
- 📊 **Response data** - Captured and stored (truncated if too large)

### Environment Variables

The worker requires the following environment variables:

```env
REDIS_HOST=localhost        # Redis host
REDIS_PORT=6379            # Redis port
DATABASE_URL=postgres://... # PostgreSQL connection string
```

See the main project `.env.example` for complete configuration.

## Worker Service Architecture

```
┌──────────────────┐
│   Redis Queue    │
│    (BullMQ)      │
└────────┬─────────┘
         │ Job
         ▼
┌──────────────────┐
│ Worker Service   │
│  - processJob()  │
└────┬─────────┬───┘
     │         │
     │ HTTP    │ Log Results
     ▼         ▼
┌─────────┐  ┌──────────┐
│ Target  │  │PostgreSQL│
│   URL   │  │ Database │
└─────────┘  └──────────┘
```

## Key Components

### WorkerService

The main service class that:

- Initializes the BullMQ Worker on module startup
- Connects to Redis using environment configuration
- Processes jobs through the `processJob()` method
- Handles both successful and failed executions
- Emits events for job completion and failure

### Job Processing

```typescript
private async processJob(job: Job) {
  // 1. Extract job data
  // 2. Execute HTTP POST request with 10s timeout
  // 3. Log success or failure to database
  // 4. Rethrow errors for BullMQ retry handling
}
```

## Error Handling

- **Network Errors**: Caught and logged with error message
- **Timeout Errors**: Requests exceeding 10 seconds are aborted
- **HTTP Errors**: Non-2xx responses are logged with status and response body
- **Retry Strategy**: Failed jobs are automatically retried by BullMQ

## Console Output

The worker provides real-time console logs:

```
Worker initialized and listening on zyphir_queue
Task Id abc123 executed successfully with status 200
Job id 456 completed
Task ID xyz789 failed Connection timeout
Job id 789 failed - Connection timeout
```

## Notes

- Response bodies larger than 5000 characters are automatically truncated
- Completed and failed jobs are automatically removed from the queue (configured by API)
- Each retry increments the attempt counter in the log
- The worker runs independently from the API service
