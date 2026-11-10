import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createTestApp } from '../testing/testApp.js';

describe('GET /api/products', () => {
  it('メニュー一覧を返す', async () => {
    const { app } = createTestApp();

    const res = await request(app).get('/api/products');

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(6);
    expect(res.body[0]).toEqual({ id: 'latte', name: 'カフェラテ', price: 550, category: 'drink' });
  });
});

describe('GET /api/products/:id', () => {
  it('商品を返す', async () => {
    const { app } = createTestApp();

    const res = await request(app).get('/api/products/matcha-latte');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ id: 'matcha-latte', name: '抹茶ラテ', price: 600, category: 'drink' });
  });

  it('存在しない商品は 404 PRODUCT_NOT_FOUND', async () => {
    const { app } = createTestApp();

    const res = await request(app).get('/api/products/unknown');

    expect(res.status).toBe(404);
    expect(res.body.error).toMatchObject({ code: 'PRODUCT_NOT_FOUND', details: { productId: 'unknown' } });
  });
});
