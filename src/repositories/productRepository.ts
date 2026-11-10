import type { Product } from '../domain/product.js';

export interface ProductRepository {
  findAll(): Product[];
  findById(id: string): Product | undefined;
}

export const seedProducts: readonly Product[] = [
  { id: 'latte', name: 'カフェラテ', price: 550, category: 'drink' },
  { id: 'cappuccino', name: 'カプチーノ', price: 500, category: 'drink' },
  { id: 'matcha-latte', name: '抹茶ラテ', price: 600, category: 'drink' },
  { id: 'drip-coffee', name: '本日のコーヒー', price: 400, category: 'drink' },
  { id: 'croissant', name: 'クロワッサン', price: 350, category: 'food' },
  { id: 'cheesecake', name: 'チーズケーキ', price: 480, category: 'food' },
];

export function createProductRepository(products: readonly Product[] = seedProducts): ProductRepository {
  const byId = new Map(products.map((product) => [product.id, { ...product }]));

  return {
    findAll: () => [...byId.values()].map((product) => ({ ...product })),
    findById: (id) => {
      const product = byId.get(id);
      return product ? { ...product } : undefined;
    },
  };
}
