import { Router } from 'express';
import { z } from 'zod';
import type { Order, OrderItem } from '../domain/order.js';
import type { Yen } from '../domain/money.js';
import { parseRequest } from '../http/validation.js';
import type { OrderService } from '../services/orderService.js';

export const MAX_QUANTITY = 99;
export const MAX_ORDER_LINES = 20;

const createOrderSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().trim().min(1),
        quantity: z.number().int().min(1).max(MAX_QUANTITY),
      }),
    )
    .min(1)
    .max(MAX_ORDER_LINES)
    .refine((items) => new Set(items.map((item) => item.productId)).size === items.length, {
      message: 'productId must be unique',
    }),
});

interface OrderResponse {
  id: string;
  items: OrderItem[];
  subtotal: Yen;
  total: Yen;
  createdAt: string;
}

function toOrderResponse(order: Order): OrderResponse {
  return {
    id: order.id,
    items: order.items.map((item) => ({ ...item })),
    subtotal: order.subtotal,
    total: order.total,
    createdAt: order.createdAt.toISOString(),
  };
}

export function createOrdersRouter(orderService: OrderService): Router {
  const router = Router();

  router.post('/', (req, res) => {
    const input = parseRequest(createOrderSchema, req.body);
    const order = orderService.createOrder(input);
    res.status(201).json(toOrderResponse(order));
  });

  router.get('/:id', (req, res) => {
    res.json(toOrderResponse(orderService.getOrder(req.params.id)));
  });

  return router;
}
