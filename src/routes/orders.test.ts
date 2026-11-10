import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createTestApp, TEST_NOW } from '../testing/testApp.js';
import { MAX_ORDER_LINES, MAX_QUANTITY } from './orders.js';

describe('POST /api/orders', () => {
  it('201 で注文を作成し、明細・小計・合計を返す', async () => {
    const { app } = createTestApp();

    const res = await request(app)
      .post('/api/orders')
      .send({
        items: [
          { productId: 'latte', quantity: 2 },
          { productId: 'croissant', quantity: 1 },
        ],
      });

    expect(res.status).toBe(201);
    expect(res.body).toEqual({
      id: 'ORD-0001',
      items: [
        { productId: 'latte', name: 'カフェラテ', unitPrice: 550, quantity: 2, lineTotal: 1100 },
        { productId: 'croissant', name: 'クロワッサン', unitPrice: 350, quantity: 1, lineTotal: 350 },
      ],
      subtotal: 1450,
      total: 1450,
      createdAt: TEST_NOW,
    });
  });

  it(`数量の境界値 1 と ${MAX_QUANTITY} は受け付ける`, async () => {
    const { app } = createTestApp();

    const res = await request(app)
      .post('/api/orders')
      .send({
        items: [
          { productId: 'latte', quantity: 1 },
          { productId: 'drip-coffee', quantity: MAX_QUANTITY },
        ],
      });

    expect(res.status).toBe(201);
    expect(res.body.subtotal).toBe(550 + 400 * MAX_QUANTITY);
  });

  it.each([
    ['items がない', {}],
    ['items が空', { items: [] }],
    ['数量が 0', { items: [{ productId: 'latte', quantity: 0 }] }],
    [`数量が ${MAX_QUANTITY + 1}`, { items: [{ productId: 'latte', quantity: MAX_QUANTITY + 1 }] }],
    ['数量が小数', { items: [{ productId: 'latte', quantity: 1.5 }] }],
    ['数量が文字列', { items: [{ productId: 'latte', quantity: '1' }] }],
    ['productId が空', { items: [{ productId: ' ', quantity: 1 }] }],
    [
      '同じ商品が重複',
      {
        items: [
          { productId: 'latte', quantity: 1 },
          { productId: 'latte', quantity: 2 },
        ],
      },
    ],
    [
      `明細が ${MAX_ORDER_LINES + 1} 行`,
      { items: Array.from({ length: MAX_ORDER_LINES + 1 }, (_, i) => ({ productId: `p${i}`, quantity: 1 })) },
    ],
  ])('%s → 400 VALIDATION_ERROR', async (_label, body) => {
    const { app } = createTestApp();

    const res = await request(app).post('/api/orders').send(body);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details.issues.length).toBeGreaterThan(0);
  });

  it('存在しない商品は 400 PRODUCT_NOT_FOUND で、注文は作られない', async () => {
    const { app, repositories } = createTestApp();

    const res = await request(app)
      .post('/api/orders')
      .send({ items: [{ productId: 'unknown', quantity: 1 }] });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      error: {
        code: 'PRODUCT_NOT_FOUND',
        message: 'Product not found: unknown',
        details: { productId: 'unknown' },
      },
    });
    expect(repositories.orders.findById('ORD-0001')).toBeUndefined();
  });
});

describe('GET /api/orders/:id', () => {
  it('作成済みの注文を返す', async () => {
    const { app } = createTestApp();
    const created = await request(app)
      .post('/api/orders')
      .send({ items: [{ productId: 'cappuccino', quantity: 1 }] });

    const res = await request(app).get(`/api/orders/${created.body.id}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual(created.body);
  });

  it('存在しない注文は 404 ORDER_NOT_FOUND', async () => {
    const { app } = createTestApp();

    const res = await request(app).get('/api/orders/ORD-9999');

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('ORDER_NOT_FOUND');
  });
});
