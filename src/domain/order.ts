import type { Yen } from './money.js';

export interface OrderItem {
  productId: string;
  name: string;
  unitPrice: Yen;
  quantity: number;
  lineTotal: Yen;
}

export interface Order {
  id: string;
  items: OrderItem[];
  subtotal: Yen;
  total: Yen;
  createdAt: Date;
}

/** 採番前の注文。id はリポジトリが割り当てる。 */
export type NewOrder = Omit<Order, 'id'>;
