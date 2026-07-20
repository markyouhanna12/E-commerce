import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';

@Injectable()
export class LoggingIntercepotor implements NestInterceptor {
  private readonly logger = new Logger('Performance');
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest();
    const method = request.method;
    const url = request.url;
    const startTime = Date.now();

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
}
