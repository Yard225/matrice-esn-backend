export class ApiResponseModel<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
  timestamp: string;
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
  ): ApiResponseModel<T> {
    return new ApiResponseModel(true, data, message, undefined, requestId);
  }

  static error(
    error: { code: string; message: string; details?: Record<string, any> },
    requestId?: string
  ): ApiResponseModel {
    return new ApiResponseModel(false, undefined, undefined, error, requestId);
  }
}