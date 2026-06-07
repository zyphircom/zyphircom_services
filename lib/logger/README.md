# Logger Module

This module provides comprehensive error logging capabilities for the NestJS application.

## Features

- **Multiple Log Levels**: ERROR, WARN, INFO, DEBUG
- **Database Persistence**: Errors are automatically saved to the database
- **Global Exception Handling**: All unhandled exceptions are automatically logged
- **Request Context**: HTTP errors include request details (URL, method, headers, body)
- **User Context**: Logs can be associated with specific users
- **Console Output**: All logs are also output to the console
- **Configurable**: Log levels and database persistence can be configured via environment variables

## Configuration

Add these environment variables to your `.env` file:

```env
# Log level: DEBUG, INFO, WARN, ERROR (default: INFO)
LOG_LEVEL=INFO

# Whether to save warnings to database: true, false (default: false)
LOG_WARNINGS_TO_DB=false
```

## Usage

### Basic Error Logging

```typescript
import { LoggerService } from "@/logger/logger.service";

@Injectable()
export class YourService {
  constructor(private logger: LoggerService) {}

  async someMethod() {
    try {
      // Your code here
    } catch (error) {
      await this.logger.error(
        "Failed to perform operation",
        error as Error,
        "YourService",
        { additionalData: "value" },
        userId, // optional
      );
      throw new InternalServerErrorException();
    }
  }
}
```

### Logging Different Levels

```typescript
// Error - always saved to database
await this.logger.error("Critical error occurred", error, "ServiceName");

// Warning - saved to database only if LOG_WARNINGS_TO_DB=true
await this.logger.warn("Something needs attention", "ServiceName");

// Info - console only
this.logger.info("Operation completed successfully", "ServiceName");

// Debug - console only (shown only if LOG_LEVEL=DEBUG)
this.logger.debug("Detailed debug information", "ServiceName");
```

### HTTP Error Logging

The global exception filter automatically logs all HTTP errors with request context:

```typescript
// Automatically captured by AllExceptionsFilter
throw new BadRequestException("Invalid input");
// This will log the error with full request details
```

## Database Schema

Error logs are stored in the `error_logs` table with the following structure:

- `id`: Auto-generated ID
- `userId`: Associated user (if available)
- `level`: Log level (ERROR, WARN, INFO, DEBUG)
- `context`: Service/module name
- `message`: Error message
- `stack`: Stack trace
- `metadata`: JSON field for additional data
- `endpoint`: HTTP endpoint (if applicable)
- `method`: HTTP method (if applicable)
- `requestId`: Request ID for tracing
- `createdAt`: Timestamp

## Best Practices

1. **Always provide context**: Include the service/module name for easier debugging
2. **Add metadata**: Include relevant data that might help debug the issue
3. **Use appropriate levels**:
   - ERROR: For actual errors that need attention
   - WARN: For potential issues or deprecated usage
   - INFO: For important events
   - DEBUG: For detailed debugging information
4. **Don't log sensitive data**: Avoid logging passwords, tokens, or personal information
5. **Handle async properly**: Always await the error logging to ensure it completes

## Example Integration

The logger has already been integrated into:

- `AuthService`: Logs sign-up failures
- `TaskService`: Logs all CRUD operation failures

These integrations demonstrate the proper error handling pattern for the application.
