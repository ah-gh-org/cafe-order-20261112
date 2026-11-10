import { describe, expect, it } from 'vitest';
import {
  buildCartLines,
  cartSubtotal,
  decrementItem,
  incrementItem,
  MAX_QUANTITY,
  toOrderRequest,
  type Cart,
} from './cart.js';
import type { ProductDto } from './types.js';

const products: ProductDto[] = [
  { id: 'latte', name: 'カフェラテ', price: 550, category: 'drink' },
  { id: 'croissant', name: 'クロワッサン', price: 350, category: 'food' },
  { id: 'cheesecake', name: 'チーズケーキ', price: 480, category: 'food' },
];

describe('incrementItem / decrementItem', () => {
  it('追加すると数量が 1 増える（元のカートは変更しない）', () => {
    const cart: Cart = { latte: 1 };
    const next = incrementItem(cart, 'latte');
    expect(next).toEqual({ latte: 2 });
    expect(cart).toEqual({ latte: 1 });
  });

  it(`数量は ${MAX_QUANTITY} を超えない`, () => {
    expect(incrementItem({ latte: MAX_QUANTITY }, 'latte')).toEqual({ latte: MAX_QUANTITY });
  });

  it('1 つ減らして 0 になった商品はカートから消える', () => {
    expect(decrementItem({ latte: 2 }, 'latte')).toEqual({ latte: 1 });
    expect(decrementItem({ latte: 1, croissant: 1 }, 'latte')).toEqual({ croissant: 1 });
  });

  it('カートにない商品を減らしても何も起きない', () => {
    expect(decrementItem({ latte: 1 }, 'croissant')).toEqual({ latte: 1 });
  });
});

describe('buildCartLines / cartSubtotal', () => {
  it('メニューの並び順で明細を作り、小計を計算する', () => {
    const lines = buildCartLines({ cheesecake: 1, latte: 2 }, products);
    expect(lines).toEqual([
      { productId: 'latte', name: 'カフェラテ', unitPrice: 550, quantity: 2, lineTotal: 1100 },
      { productId: 'cheesecake', name: 'チーズケーキ', unitPrice: 480, quantity: 1, lineTotal: 480 },
    ]);
    expect(cartSubtotal(lines)).toBe(1580);
  });

  it('空のカートは明細なし・小計 0 円', () => {
    const lines = buildCartLines({}, products);
    expect(lines).toEqual([]);
    expect(cartSubtotal(lines)).toBe(0);
  });
});

describe('toOrderRequest', () => {
  it('POST /api/orders のリクエストボディを作る', () => {
    expect(toOrderRequest({ latte: 2, croissant: 1 })).toEqual({
      items: [
        { productId: 'latte', quantity: 2 },
        { productId: 'croissant', quantity: 1 },
      ],
    });
  });

  it('数量 0 の商品は送らない', () => {
    expect(toOrderRequest({ latte: 0, croissant: 1 })).toEqual({
      items: [{ productId: 'croissant', quantity: 1 }],
    });
  });
});
