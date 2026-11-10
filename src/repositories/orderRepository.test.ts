import { describe, expect, it } from 'vitest';
import type { NewOrder } from '../domain/order.js';
import { createOrderRepository, formatOrderId } from './orderRepository.js';

const newOrder: NewOrder = {
  items: [{ productId: 'latte', name: 'カフェラテ', unitPrice: 550, quantity: 2, lineTotal: 1100 }],
  subtotal: 1100,
  total: 1100,
  createdAt: new Date('2026-04-01T01:00:00.000Z'),
};

describe('formatOrderId', () => {
  it('4 桁ゼロ埋めの注文番号を返す', () => {
    expect(formatOrderId(1)).toBe('ORD-0001');
    expect(formatOrderId(12345)).toBe('ORD-12345');
  });
});

describe('OrderRepository', () => {
  it('作成順に注文番号を採番する', () => {
    const repository = createOrderRepository();
    expect(repository.create(newOrder).id).toBe('ORD-0001');
    expect(repository.create(newOrder).id).toBe('ORD-0002');
  });

  it('作成した注文を id で取得できる', () => {
    const repository = createOrderRepository();
    const created = repository.create(newOrder);
    expect(repository.findById(created.id)).toEqual(created);
  });

  it('存在しない id は undefined', () => {
    expect(createOrderRepository().findById('ORD-9999')).toBeUndefined();
  });

  it('返した注文を変更しても保存内容は変わらない', () => {
    const repository = createOrderRepository();
    const created = repository.create(newOrder);
    created.total = 0;
    expect(repository.findById(created.id)?.total).toBe(1100);
  });
});
