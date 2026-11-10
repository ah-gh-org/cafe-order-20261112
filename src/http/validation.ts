import type { z } from 'zod';
import { AppError } from './errors.js';

interface ValidationIssue {
  path: string;
  message: string;
}

/** zod スキーマでリクエストを検証する。失敗時は 400 VALIDATION_ERROR を throw する。 */
export function parseRequest<Schema extends z.ZodType>(schema: Schema, input: unknown): z.output<Schema> {
  const result = schema.safeParse(input);
  if (!result.success) {
    const issues: ValidationIssue[] = result.error.issues.map((issue) => ({
      path: issue.path.map(String).join('.'),
      message: issue.message,
    }));
    throw new AppError(400, 'VALIDATION_ERROR', 'Request validation failed', { issues });
  }
  return result.data;
}
