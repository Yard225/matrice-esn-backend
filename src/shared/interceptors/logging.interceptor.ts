import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    
    const { method, url, headers, body, query, params } = request;
    const userAgent = headers['user-agent'];
    const ip = request.ip;
    const requestId = headers['x-request-id'];
    const userId = (request as any).user?.id;
    
    const startTime = Date.now();

    const logContext = {
      requestId,
      method,
      url,
      userAgent,
      ip,
      userId,
      query: Object.keys(query).length ? query : undefined,
      params: Object.keys(params).length ? params : undefined,
      bodySize: body ? JSON.stringify(body).length : 0,
    };

    this.logger.log('Incoming Request', logContext);

    return next.handle().pipe(
      tap({
        next: (data) => {
          const duration = Date.now() - startTime;
          const responseSize = data ? JSON.stringify(data).length : 0;
          
          this.logger.log('Request Completed', {
            ...logContext,
            statusCode: response.statusCode,
            duration: `${duration}ms`,
            responseSize,
          });
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          
          this.logger.error('Request Failed', {
            ...logContext,
            duration: `${duration}ms`,
            error: error.message,
          });
        },
      })
    );
  }
}