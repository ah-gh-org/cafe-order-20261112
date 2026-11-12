import type { Clock } from '../domain/clock.js';
import type { Order } from '../domain/order.js';
import { AppError } from '../http/errors.js';
import type { OrderRepository } from '../repositories/orderRepository.js';
import type { ProductRepository } from '../repositories/productRepository.js';
import { applyCoupon } from './coupons.js';
import { priceOrder, type PricingLine } from './pricing.js';

interface OrderItemsInput {
  items: { productId: string; quantity: number }[];
}

interface CreateOrderInput extends OrderItemsInput {
  couponCode?: string;
}

interface PreviewOrderInput extends OrderItemsInput {
  couponCode: string;
}

interface OrderPreview {
  subtotal: number;
  discount: number;
  total: number;
}

interface OrderServiceDeps {
  clock: Clock;
  products: ProductRepository;
  orders: OrderRepository;
}

export interface OrderService {
  createOrder(input: CreateOrderInput): Order;
  previewOrder(input: PreviewOrderInput): OrderPreview;
  getOrder(id: string): Order;
}

export function createOrderService({ clock, products, orders }: OrderServiceDeps): OrderService {
  function toPricingLine({ productId, quantity }: OrderItemsInput['items'][number]): PricingLine {
    const product = products.findById(productId);
    if (!product) {
      throw new AppError(400, 'PRODUCT_NOT_FOUND', `Product not found: ${productId}`, { productId });
    }
    return { product, quantity };
  }

  return {
    createOrder(input) {
      const lines = input.items.map(toPricingLine);
      const subtotal = priceOrder(lines).subtotal;
      const now = clock.now();
      const coupon =
        input.couponCode === undefined ? null : applyCoupon(input.couponCode, subtotal, now);
      const pricing = priceOrder(lines, coupon?.discount);
      return orders.create({
        items: pricing.items,
        subtotal: pricing.subtotal,
        couponCode: coupon?.couponCode ?? null,
        discount: pricing.discount,
        total: pricing.total,
        createdAt: now,
      });
    },
    previewOrder(input) {
      const lines = input.items.map(toPricingLine);
      const subtotal = priceOrder(lines).subtotal;
      const coupon = applyCoupon(input.couponCode, subtotal, clock.now());
      const pricing = priceOrder(lines, coupon.discount);
      return { subtotal: pricing.subtotal, discount: pricing.discount, total: pricing.total };
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
