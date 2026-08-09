import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Observable, tap } from 'rxjs';

@Injectable()
export class LoggingIntercepotor implements NestInterceptor {
  private readonly logger = new Logger('Performance');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const startTime = Date.now();

    // ==========================================
    // HTTP / REST
    // ==========================================
    if (context.getType<string>() === 'http') {
      const ctx = context.switchToHttp();
      const request = ctx.getRequest();

      const method = request.method;
      const url = request.url;

      this.logger.log(`Before Handling router : [${method}] ${url}`);

      return next.handle().pipe(
        tap(() => {
          const duration = Date.now() - startTime;

          this.logger.log(
            `After Handling router : [${method}] ${url} - Took: ${duration}ms`,
          );
        }),
      );
    }

    // ==========================================
    // GraphQL
    // ==========================================
    if (context.getType<string>() === 'graphql') {
      const gqlContext = GqlExecutionContext.create(context);

      const info = gqlContext.getInfo();

      const operationName = info.fieldName;

      this.logger.log(`Before Handling GraphQL Query : [${operationName}]`);

      return next.handle().pipe(
        tap(() => {
          const duration = Date.now() - startTime;

          this.logger.log(
            `After Handling GraphQL Query : [${operationName}] - Took: ${duration}ms`,
          );
        }),
      );
    }

    // ==========================================
    // Other context types
    // ==========================================
    return next.handle();
  }
}
