import type { OrderItem } from '../domain/order.js';
import type { Product } from '../domain/product.js';
import { multiplyYen, sumYen, type Yen } from '../domain/money.js';

/** 金額計算はすべてこのモジュールの純粋関数で行う（I/O なし）。外に出すのは priceOrder だけ。 */

export interface PricingLine {
  product: Product;
  quantity: number;
}

interface OrderPricing {
  items: OrderItem[];
  subtotal: Yen;
  discount: Yen;
  total: Yen;
}

export function priceOrder(lines: readonly PricingLine[], requestedDiscount: Yen = 0): OrderPricing {
  const items = lines.map(toOrderItem);
  const subtotal = sumYen(items.map((item) => item.lineTotal));
  const discount = Math.min(requestedDiscount, subtotal) as Yen;
  return { items, subtotal, discount, total: (subtotal - discount) as Yen };
}

function toOrderItem({ product, quantity }: PricingLine): OrderItem {
  return {
    productId: product.id,
    name: product.name,
    unitPrice: product.price,
    quantity,
    lineTotal: multiplyYen(product.price, quantity),
  };
}
