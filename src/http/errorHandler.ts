import type { ErrorRequestHandler, RequestHandler } from 'express';
import { AppError } from './errors.js';

export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(new AppError(404, 'NOT_FOUND', `Route not found: ${req.method} ${req.baseUrl}${req.path}`));
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  const appError = toAppError(err);
  if (appError.status >= 500) {
    console.error(err);
  }
  res.status(appError.status).json(appError.toResponseBody());
};

export function toAppError(err: unknown): AppError {
  if (err instanceof AppError) {
    return err;
  }
  if (isBodyParserError(err)) {
    return new AppError(400, 'VALIDATION_ERROR', 'Request body is not valid JSON', { reason: err.type });
  }
  return new AppError(500, 'INTERNAL_ERROR', 'Internal server error');
}

/** express.json() が投げるエラー（不正な JSON、サイズ超過など）。 */
function isBodyParserError(err: unknown): err is { type: string; status: number } {
  if (typeof err !== 'object' || err === null) {
    return false;
  }
  const { type, status } = err as { type?: unknown; status?: unknown };
  return typeof type === 'string' && typeof status === 'number' && status >= 400 && status < 500;
}
