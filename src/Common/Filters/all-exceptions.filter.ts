import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { GqlArgumentsHost } from '@nestjs/graphql';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: any, host: ArgumentsHost) {
    const type = host.getType();

    // ==========================================
    // HTTP / REST
    // ==========================================
    if (type === 'http') {
      const ctx = host.switchToHttp();

      const request = ctx.getRequest();
      const response = ctx.getResponse();

      const status =
        exception instanceof HttpException
          ? exception.getStatus()
          : HttpStatus.INTERNAL_SERVER_ERROR;

      let errorResponsePayload: string | object = 'Internal Server Error';

      if (exception instanceof HttpException) {
        errorResponsePayload = exception.getResponse();
      } else if (exception instanceof Error) {
        errorResponsePayload = exception.message;
      }

      const errorMessage =
        typeof errorResponsePayload === 'object' &&
        errorResponsePayload !== null
          ? (errorResponsePayload as any).message ||
            JSON.stringify(errorResponsePayload)
          : errorResponsePayload;

      this.logger.error(
        `HTTP Error Interrupted [${request.method}] ${request.url} - status : ${status} - Error: ${errorMessage}`,
      );

      return response.status(status).json({
        success: false,
        statusCode: status,
        timestamps: new Date().toISOString(),
        path: request.url,
        method: request.method,
        error: {
          message: errorMessage,
          type:
            exception instanceof HttpException
              ? exception.name
              : 'Internal Server Error',
        },
      });
    }

    // ==========================================
    // GraphQL
    // ==========================================
    if (type === 'rpc' || type === 'ws' || type === 'graphql') {
      const gqlHost = GqlArgumentsHost.create(host);

      const context = gqlHost.getContext();

      const request = context?.req;

      const status =
        exception instanceof HttpException
          ? exception.getStatus()
          : HttpStatus.INTERNAL_SERVER_ERROR;

      let errorResponsePayload: string | object = 'Internal Server Error';

      if (exception instanceof HttpException) {
        errorResponsePayload = exception.getResponse();
      } else if (exception instanceof Error) {
        errorResponsePayload = exception.message;
      }

      const errorMessage =
        typeof errorResponsePayload === 'object' &&
        errorResponsePayload !== null
          ? (errorResponsePayload as any).message ||
            JSON.stringify(errorResponsePayload)
          : errorResponsePayload;

      this.logger.error(
        `GraphQL Error [${request?.method ?? 'UNKNOWN'}] - status : ${status} - Error: ${errorMessage}`,
      );

      // Let Apollo / GraphQL handle the exception
      throw exception;
    }
  }
}
