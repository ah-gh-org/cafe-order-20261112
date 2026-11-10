import type { CreateOrderRequest, ProductDto } from './types.js';

/** カートの中身（商品 ID → 数量）。更新するたびに新しいオブジェクトを返す。 */
export type Cart = Readonly<Record<string, number>>;

export const MAX_QUANTITY = 99;

export interface CartLine {
  productId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export function incrementItem(cart: Cart, productId: string): Cart {
  const quantity = Math.min((cart[productId] ?? 0) + 1, MAX_QUANTITY);
  return { ...cart, [productId]: quantity };
}

export function decrementItem(cart: Cart, productId: string): Cart {
  const quantity = (cart[productId] ?? 0) - 1;
  if (quantity <= 0) {
    const { [productId]: _removed, ...rest } = cart;
    return rest;
  }
  return { ...cart, [productId]: quantity };
}

/** メニューの並び順でカートの明細を作る（画面表示用の概算）。 */
export function buildCartLines(cart: Cart, products: readonly ProductDto[]): CartLine[] {
  return products
    .filter((product) => (cart[product.id] ?? 0) > 0)
    .map((product) => {
      const quantity = cart[product.id] ?? 0;
      return {
        productId: product.id,
        name: product.name,
        unitPrice: product.price,
        quantity,
        lineTotal: product.price * quantity,
      };
    });
}

export function cartSubtotal(lines: readonly CartLine[]): number {
  return lines.reduce((sum, line) => sum + line.lineTotal, 0);
}

export function toOrderRequest(cart: Cart): CreateOrderRequest {
  return {
    items: Object.entries(cart)
      .filter(([, quantity]) => quantity > 0)
      .map(([productId, quantity]) => ({ productId, quantity })),
  };
}
