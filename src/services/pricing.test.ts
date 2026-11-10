import { describe, expect, it } from 'vitest';
import type { Product } from '../domain/product.js';
import { priceOrder } from './pricing.js';

const latte: Product = { id: 'latte', name: 'カフェラテ', price: 550, category: 'drink' };
const croissant: Product = { id: 'croissant', name: 'クロワッサン', price: 350, category: 'food' };

describe('priceOrder', () => {
  it('明細がなければ小計・合計とも 0 円', () => {
    expect(priceOrder([])).toEqual({ items: [], subtotal: 0, total: 0 });
  });

  it('1 明細なら商品と数量から注文明細を作り、小計・合計は明細金額と同じ', () => {
    expect(priceOrder([{ product: latte, quantity: 2 }])).toEqual({
      items: [{ productId: 'latte', name: 'カフェラテ', unitPrice: 550, quantity: 2, lineTotal: 1100 }],
      subtotal: 1100,
      total: 1100,
    });
  });

  it('複数明細なら明細金額を合計し、明細は入力の順に並ぶ', () => {
    const pricing = priceOrder([
      { product: latte, quantity: 2 },
      { product: croissant, quantity: 1 },
    ]);
    expect(pricing.items.map((item) => item.productId)).toEqual(['latte', 'croissant']);
    expect(pricing.items.map((item) => item.lineTotal)).toEqual([1100, 350]);
    expect(pricing.subtotal).toBe(1450);
    expect(pricing.total).toBe(1450);
  });

  it.each([
    { quantity: 0, lineTotal: 0 },
    { quantity: 1, lineTotal: 550 },
    { quantity: 3, lineTotal: 1650 },
  ])('数量 $quantity → 明細金額 $lineTotal 円', ({ quantity, lineTotal }) => {
    const pricing = priceOrder([{ product: latte, quantity }]);
    expect(pricing.items[0]?.lineTotal).toBe(lineTotal);
    expect(pricing.total).toBe(lineTotal);
  });

  it.each([-1, 1.5])('数量 %s は RangeError', (quantity) => {
    expect(() => priceOrder([{ product: latte, quantity }])).toThrow(RangeError);
  });
});
