import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Injectable,
} from "@nestjs/common";
import { Request, Response } from "express";
import { LoggerService } from "@lib/logger/logger.service";

@Catch()
@Injectable()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly logger: LoggerService) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : "Internal server error";

    const error =
      exception instanceof Error ? exception : new Error(String(exception));

    interface RequestWithUser extends Request {
      user?: { userId: string };
    }
    const userId = (request as RequestWithUser).user?.userId;

    if (!(error as any).alreadyLogged) {
      this.logger.logHttpError(error, request, userId).catch((logError) => {
        console.error("Failed to log error:", logError);
      });
    }

    response.status(status).json({
      statusCode: status,
      message:
        typeof message === "string"
          ? message
          : (message as Record<string, any>).message || "Internal server error",
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
