import { describe, expect, it } from 'vitest';
import { fixedClock } from '../domain/clock.js';
import { AppError } from '../http/errors.js';
import { createOrderRepository } from '../repositories/orderRepository.js';
import { createProductRepository } from '../repositories/productRepository.js';
import { createOrderService } from './orderService.js';

function setup() {
  const clock = fixedClock('2026-04-01T01:00:00.000Z');
  const orders = createOrderRepository();
  const service = createOrderService({ clock, products: createProductRepository(), orders });
  return { service, orders };
}

describe('OrderService.createOrder', () => {
  it('商品を解決して金額を計算し、注文を保存する', () => {
    const { service, orders } = setup();

    const order = service.createOrder({
      items: [
        { productId: 'latte', quantity: 2 },
        { productId: 'cheesecake', quantity: 1 },
      ],
    });

    expect(order).toEqual({
      id: 'ORD-0001',
      items: [
        { productId: 'latte', name: 'カフェラテ', unitPrice: 550, quantity: 2, lineTotal: 1100 },
        { productId: 'cheesecake', name: 'チーズケーキ', unitPrice: 480, quantity: 1, lineTotal: 480 },
      ],
      subtotal: 1580,
      total: 1580,
      createdAt: new Date('2026-04-01T01:00:00.000Z'),
    });
    expect(orders.findById('ORD-0001')).toEqual(order);
  });

  it('存在しない商品は 400 PRODUCT_NOT_FOUND で、注文は作られない', () => {
    const { service, orders } = setup();

    const act = () => service.createOrder({ items: [{ productId: 'unknown', quantity: 1 }] });

    expect(act).toThrow(AppError);
    expect(act).toThrow(expect.objectContaining({ status: 400, code: 'PRODUCT_NOT_FOUND' }));
    expect(orders.findById('ORD-0001')).toBeUndefined();
  });
});

describe('OrderService.getOrder', () => {
  it('保存済みの注文を返す', () => {
    const { service } = setup();
    const created = service.createOrder({ items: [{ productId: 'latte', quantity: 1 }] });
    expect(service.getOrder(created.id)).toEqual(created);
  });

  it('存在しない注文は 404 ORDER_NOT_FOUND', () => {
    const { service } = setup();
    expect(() => service.getOrder('ORD-9999')).toThrow(
      expect.objectContaining({ status: 404, code: 'ORDER_NOT_FOUND' }),
    );
  });
});
