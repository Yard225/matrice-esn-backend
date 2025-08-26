import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiResponseDto } from '@/core/application/dtos/api-response.dto';
import { BusinessRuleException } from '@/core/domain/exceptions/business-rule.exception';
import { DomainException } from '@/core/domain/exceptions/domain.exception';
import { InvalidEmailException } from '@/core/domain/exceptions/invalid-email.exception';
import { AccountDeactivatedException } from '../../features/auth/domain/exceptions/account-deactivated.exception';
import { InvalidCredentialsException } from '../../features/auth/domain/exceptions/invalid-credentials.exception';
import { UserNotFoundException } from '../../features/auth/domain/exceptions/user-not-found.exception';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const requestId = request.headers['x-request-id'] as string;

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorCode = 'INTERNAL_SERVER_ERROR';
    let message = 'Internal server error';
    let details: Record<string, any> | undefined;

    // Handle different types of exceptions
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const errorResponse = exception.getResponse();
      
      if (typeof errorResponse === 'string') {
        message = errorResponse;
        errorCode = exception.constructor.name.replace('Exception', '').toUpperCase();
      } else if (typeof errorResponse === 'object' && errorResponse !== null) {
        const errorObj = errorResponse as any;
        message = errorObj.message || errorObj.error || message;
        errorCode = errorObj.code || errorCode;
        details = errorObj.details;
      }
    } else if (exception instanceof InvalidEmailException) {
      status = HttpStatus.BAD_REQUEST;
      errorCode = exception.code;
      message = exception.message;
      details = exception.details;
    } else if (exception instanceof UserNotFoundException) {
      status = HttpStatus.NOT_FOUND;
      errorCode = exception.code;
      message = exception.message;
      details = exception.details;
    } else if (exception instanceof InvalidCredentialsException) {
      status = HttpStatus.UNAUTHORIZED;
      errorCode = exception.code;
      message = exception.message;
      details = exception.details;
    } else if (exception instanceof AccountDeactivatedException) {
      status = HttpStatus.FORBIDDEN;
      errorCode = exception.code;
      message = exception.message;
      details = exception.details;
    } else if (exception instanceof BusinessRuleException) {
      status = HttpStatus.BAD_REQUEST;
      errorCode = exception.code;
      message = exception.message;
      details = exception.details;
    } else if (exception instanceof DomainException) {
      status = HttpStatus.BAD_REQUEST;
      errorCode = exception.code;
      message = exception.message;
      details = exception.details;
    } else if (exception instanceof Error) {
      message = exception.message;
      errorCode = exception.constructor.name.toUpperCase();
    }

    // Log the error
    const logContext = {
      requestId,
      method: request.method,
      url: request.url,
      userAgent: request.headers['user-agent'],
      ip: request.ip,
      userId: (request as any).user?.id,
      status,
      errorCode,
      message,
      details,
      stack: exception instanceof Error ? exception.stack : undefined,
    };

    if (status >= 500) {
      this.logger.error('Server Error', logContext);
    } else {
      this.logger.warn('Client Error', logContext);
    }

    // Send error response
    const errorResponse = ApiResponseDto.error(
      {
        code: errorCode,
        message,
        details,
      },
      requestId
    );

    response.status(status).json(errorResponse);
  }
}