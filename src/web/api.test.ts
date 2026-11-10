import { describe, expect, it, vi } from 'vitest';
import { ApiError, createOrder, fetchProducts, toApiErrorBody, type FetchLike } from './api.js';

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

describe('fetchProducts', () => {
  it('GET /api/products の結果を返す', async () => {
    const products = [{ id: 'latte', name: 'カフェラテ', price: 550, category: 'drink' }];
    const fetchFn = vi.fn<FetchLike>().mockResolvedValue(jsonResponse(200, products));

    await expect(fetchProducts(fetchFn)).resolves.toEqual(products);
    expect(fetchFn).toHaveBeenCalledWith('/api/products', undefined);
  });
});

describe('createOrder', () => {
  it('POST /api/orders に JSON を送る', async () => {
    const fetchFn = vi.fn<FetchLike>().mockResolvedValue(jsonResponse(201, { id: 'ORD-0001' }));

    await expect(createOrder({ items: [{ productId: 'latte', quantity: 1 }] }, fetchFn)).resolves.toEqual({
      id: 'ORD-0001',
    });
    expect(fetchFn).toHaveBeenCalledWith('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{"items":[{"productId":"latte","quantity":1}]}',
    });
  });

  it('エラーレスポンスは ApiError（コード付き）になる', async () => {
    const body = { error: { code: 'VALIDATION_ERROR', message: 'Request validation failed', details: { issues: [] } } };
    const fetchFn = vi.fn<FetchLike>().mockResolvedValue(jsonResponse(400, body));

    const error = await createOrder({ items: [] }, fetchFn).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 400, body: body.error });
  });

  it('エラー形式でないレスポンスは UNKNOWN_ERROR', async () => {
    const fetchFn = vi.fn<FetchLike>().mockResolvedValue(new Response('Bad Gateway', { status: 502 }));

    await expect(createOrder({ items: [] }, fetchFn)).rejects.toMatchObject({
      status: 502,
      body: { code: 'UNKNOWN_ERROR', message: 'HTTP 502' },
    });
  });

  it('通信できなければ NETWORK_ERROR', async () => {
    const fetchFn = vi.fn<FetchLike>().mockRejectedValue(new TypeError('Failed to fetch'));

    await expect(createOrder({ items: [] }, fetchFn)).rejects.toMatchObject({
      status: 0,
      body: { code: 'NETWORK_ERROR' },
    });
  });
});

describe('toApiErrorBody', () => {
  it('ApiError はそのままの本文を返す', () => {
    const body = { code: 'PRODUCT_NOT_FOUND', message: 'x', details: {} };
    expect(toApiErrorBody(new ApiError(400, body))).toBe(body);
  });

  it('それ以外は UNKNOWN_ERROR', () => {
    expect(toApiErrorBody(new Error('boom'))).toEqual({ code: 'UNKNOWN_ERROR', message: 'Error: boom', details: {} });
  });
});
