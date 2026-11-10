import { describe, expect, it } from 'vitest';
import { createProductRepository, seedProducts } from './productRepository.js';

describe('ProductRepository', () => {
  it('シードのメニュー 6 品を返す', () => {
    const repository = createProductRepository();
    expect(repository.findAll().map((product) => product.id)).toEqual([
      'latte',
      'cappuccino',
      'matcha-latte',
      'drip-coffee',
      'croissant',
      'cheesecake',
    ]);
  });

  it('価格はすべて 0 以上の整数（円）', () => {
    for (const product of seedProducts) {
      expect(Number.isSafeInteger(product.price)).toBe(true);
      expect(product.price).toBeGreaterThanOrEqual(0);
    }
  });

  it('id で商品を取得できる', () => {
    const repository = createProductRepository();
    expect(repository.findById('latte')).toEqual({
      id: 'latte',
      name: 'カフェラテ',
      price: 550,
      category: 'drink',
    });
  });

  it('存在しない id は undefined', () => {
    expect(createProductRepository().findById('unknown')).toBeUndefined();
  });

  it('返した商品を変更してもリポジトリの内容は変わらない', () => {
    const repository = createProductRepository();
    const product = repository.findById('latte');
    if (product) {
      product.price = 1;
    }
    expect(repository.findById('latte')?.price).toBe(550);
  });
});
