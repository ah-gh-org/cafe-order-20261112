import type { NewOrder, Order } from '../domain/order.js';

export interface OrderRepository {
  create(order: NewOrder): Order;
  findById(id: string): Order | undefined;
}

export function formatOrderId(sequence: number): string {
  return `ORD-${String(sequence).padStart(4, '0')}`;
}

export function createOrderRepository(): OrderRepository {
  const orders = new Map<string, Order>();
  let sequence = 0;

  return {
    create(newOrder) {
      sequence += 1;
      const order: Order = { id: formatOrderId(sequence), ...structuredClone(newOrder) };
      orders.set(order.id, order);
      return structuredClone(order);
    },
    findById(id) {
      const order = orders.get(id);
      return order ? structuredClone(order) : undefined;
    },
  };
}
