import type { Clock } from '../domain/clock.js';
import type { Order } from '../domain/order.js';
import { AppError } from '../http/errors.js';
import type { OrderRepository } from '../repositories/orderRepository.js';
import type { ProductRepository } from '../repositories/productRepository.js';
import { priceOrder, type PricingLine } from './pricing.js';

interface CreateOrderInput {
  items: { productId: string; quantity: number }[];
}

interface OrderServiceDeps {
  clock: Clock;
  products: ProductRepository;
  orders: OrderRepository;
}

export interface OrderService {
  createOrder(input: CreateOrderInput): Order;
  getOrder(id: string): Order;
}

export function createOrderService({ clock, products, orders }: OrderServiceDeps): OrderService {
  function toPricingLine({ productId, quantity }: CreateOrderInput['items'][number]): PricingLine {
    const product = products.findById(productId);
    if (!product) {
      throw new AppError(400, 'PRODUCT_NOT_FOUND', `Product not found: ${productId}`, { productId });
    }
    return { product, quantity };
  }

  return {
    createOrder(input) {
      const pricing = priceOrder(input.items.map(toPricingLine));
      return orders.create({
        items: pricing.items,
        subtotal: pricing.subtotal,
        total: pricing.total,
        createdAt: clock.now(),
      });
    },
    getOrder(id) {
      const order = orders.findById(id);
      if (!order) {
        throw new AppError(404, 'ORDER_NOT_FOUND', `Order not found: ${id}`, { orderId: id });
      }
      return order;
    },
  };
}
