import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Request } from 'express';
import { ApiResponseDto } from '@/core/controllers/dtos/api-response.dto';

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, ApiResponseDto<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler
  ): Observable<ApiResponseDto<T>> {
    const request = context.switchToHttp().getRequest<Request>();
    const requestId = request.headers['x-request-id'] as string;

    return next.handle().pipe(
      map((data) => {
        // If data is already wrapped in ApiResponseDto, return as is
        if (data instanceof ApiResponseDto) {
          return data;
        }

        // If data has success property, it's likely already formatted
        if (data && typeof data === 'object' && 'success' in data) {
          return data as ApiResponseDto<T>;
        }

        // Wrap the data in ApiResponseDto
        return ApiResponseDto.success(data, undefined, requestId);
      })
    );
  }
}