import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ApiResponseDto<T = any> {
  @ApiProperty({
    description: 'Indicates if the request was successful',
    example: true,
  })
  success: boolean;

  @ApiPropertyOptional({
    description: 'Response data',
  })
  data?: T;

  @ApiPropertyOptional({
    description: 'Success or informational message',
    example: 'Operation completed successfully',
  })
  message?: string;

  @ApiPropertyOptional({
    description: 'Error details if success is false',
  })
  error?: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };

  @ApiProperty({
    description: 'Request timestamp',
    example: '2024-01-01T00:00:00.000Z',
  })
  timestamp: string;

  @ApiPropertyOptional({
    description: 'Request correlation ID for tracking',
    example: 'req_123456789',
  })
  requestId?: string;

  constructor(
    success: boolean,
    data?: T,
    message?: string,
    error?: any,
    requestId?: string
  ) {
    this.success = success;
    this.data = data;
    this.message = message;
    this.error = error;
    this.timestamp = new Date().toISOString();
    this.requestId = requestId;
  }

  static success<T>(
    data?: T,
    message?: string,
    requestId?: string
  ): ApiResponseDto<T> {
    return new ApiResponseDto(true, data, message, undefined, requestId);
  }

  static error(
    error: { code: string; message: string; details?: Record<string, any> },
    requestId?: string
  ): ApiResponseDto {
    return new ApiResponseDto(false, undefined, undefined, error, requestId);
  }
}