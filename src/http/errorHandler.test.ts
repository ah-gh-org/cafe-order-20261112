import { describe, expect, it, vi } from 'vitest';
import type { Request, Response } from 'express';
import { errorHandler, toAppError } from './errorHandler.js';
import { AppError } from './errors.js';

describe('toAppError', () => {
  it('AppError はそのまま返す', () => {
    const error = new AppError(404, 'ORDER_NOT_FOUND', 'Order not found: X');
    expect(toAppError(error)).toBe(error);
  });

  it('express.json() のエラーは 400 VALIDATION_ERROR', () => {
    const error = Object.assign(new Error('too large'), { type: 'entity.too.large', status: 413 });
    expect(toAppError(error)).toMatchObject({
      status: 400,
      code: 'VALIDATION_ERROR',
      details: { reason: 'entity.too.large' },
    });
  });

  it.each([new Error('boom'), 'boom', null, { type: 'x', status: 500 }])(
    '想定外のエラー %s は 500 INTERNAL_ERROR',
    (error) => {
      expect(toAppError(error)).toMatchObject({ status: 500, code: 'INTERNAL_ERROR' });
    },
  );
});

describe('errorHandler', () => {
  function createResponse() {
    const res = { status: vi.fn(), json: vi.fn() };
    res.status.mockReturnValue(res);
    return res;
  }

  it('AppError をステータスと JSON に変換する', () => {
    const res = createResponse();
    errorHandler(
      new AppError(400, 'VALIDATION_ERROR', 'bad', { field: 'items' }),
      {} as Request,
      res as unknown as Response,
      vi.fn(),
    );
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: { code: 'VALIDATION_ERROR', message: 'bad', details: { field: 'items' } },
    });
  });

  it('500 の場合は内部情報を返さずログに出す', () => {
    const res = createResponse();
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    errorHandler(new Error('secret detail'), {} as Request, res as unknown as Response, vi.fn());
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: { code: 'INTERNAL_ERROR', message: 'Internal server error', details: {} },
    });
    expect(consoleError).toHaveBeenCalledOnce();
    consoleError.mockRestore();
  });
});
