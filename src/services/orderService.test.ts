import { describe, expect, it } from 'vitest';
import { fixedClock, type Clock } from '../domain/clock.js';
import { AppError } from '../http/errors.js';
import { createOrderRepository } from '../repositories/orderRepository.js';
import { createProductRepository } from '../repositories/productRepository.js';
import { createOrderService } from './orderService.js';

function setup(now = '2026-04-01T01:00:00.000Z', clock?: Clock) {
  const serviceClock = clock ?? fixedClock(now);
  const orders = createOrderRepository();
  const service = createOrderService({ clock: serviceClock, products: createProductRepository(), orders });
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
      couponCode: null,
      discount: 0,
      total: 1580,
      createdAt: new Date('2026-04-01T01:00:00.000Z'),
    });
    expect(orders.findById('ORD-0001')).toEqual(order);
  });

  it('クーポンを正規化して再計算し、割引情報を注文に保存する', () => {
    const { service } = setup('2026-10-10T00:00:00+09:00');
    const order = service.createOrder({
      items: [
        { productId: 'latte', quantity: 2 },
        { productId: 'croissant', quantity: 1 },
      ],
      couponCode: ' welcome10 ',
    });

    expect(order).toMatchObject({
      subtotal: 1450,
      couponCode: 'WELCOME10',
      discount: 145,
      total: 1305,
    });
  });

  it('見積もりは注文を保存せず、小計・割引・合計を返す', () => {
    const { service, orders } = setup('2026-10-10T00:00:00+09:00');

    expect(
      service.previewOrder({
        items: [
          { productId: 'latte', quantity: 2 },
          { productId: 'croissant', quantity: 1 },
        ],
        couponCode: 'WELCOME10',
      }),
    ).toEqual({ subtotal: 1450, discount: 145, total: 1305 });
    expect(orders.findById('ORD-0001')).toBeUndefined();
  });

  it('見積もり後に期限切れになったクーポンは注文確定時に拒否する', () => {
    let currentTime = new Date('2027-01-07T14:59:59.999Z');
    const clock: Clock = { now: () => new Date(currentTime) };
    const { service, orders } = setup(undefined, clock);
    const input = {
      items: [{ productId: 'latte', quantity: 2 }],
      couponCode: 'WELCOME10',
    };

    expect(service.previewOrder(input)).toEqual({ subtotal: 1100, discount: 110, total: 990 });
    currentTime = new Date('2027-01-07T15:00:00.000Z');
    expect(() => service.createOrder(input)).toThrow(
      expect.objectContaining({ code: 'COUPON_EXPIRED' }),
    );
    expect(orders.findById('ORD-0001')).toBeUndefined();
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
