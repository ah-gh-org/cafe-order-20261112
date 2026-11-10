type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'PRODUCT_NOT_FOUND'
  | 'ORDER_NOT_FOUND'
  | 'NOT_FOUND'
  | 'INTERNAL_ERROR';

type ErrorStatus = 400 | 404 | 500;

type ErrorDetails = Record<string, unknown>;

interface ErrorResponseBody {
  error: {
    code: ErrorCode;
    message: string;
    details: ErrorDetails;
  };
}

/**
 * API で返すアプリケーションエラー。
 * Express に依存しないので services からも throw してよい。
 */
export class AppError extends Error {
  readonly status: ErrorStatus;
  readonly code: ErrorCode;
  readonly details: ErrorDetails;

  constructor(status: ErrorStatus, code: ErrorCode, message: string, details: ErrorDetails = {}) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.code = code;
    this.details = details;
  }

  toResponseBody(): ErrorResponseBody {
    return { error: { code: this.code, message: this.message, details: this.details } };
  }
}
