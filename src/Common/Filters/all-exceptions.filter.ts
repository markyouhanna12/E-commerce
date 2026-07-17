import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

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
      typeof errorResponsePayload === 'object' && errorResponsePayload !== null
        ? (errorResponsePayload as any).message ||
          JSON.stringify(errorResponsePayload)
        : errorResponsePayload;

    this.logger.error(
      `HTTP Error Interrupted [${request.method}] ${request.url} - status : ${status} - Error: ${errorMessage}`,
    );

    response.status(status).json({
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
}
