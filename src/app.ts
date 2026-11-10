import express, { type Express } from 'express';
import type { Clock } from './domain/clock.js';
import { errorHandler, notFoundHandler } from './http/errorHandler.js';
import type { Repositories } from './repositories/index.js';
import { createHealthRouter } from './routes/health.js';
import { createOrdersRouter } from './routes/orders.js';
import { createProductsRouter } from './routes/products.js';
import { createOrderService } from './services/orderService.js';
import { createProductService } from './services/productService.js';

interface AppDeps {
  clock: Clock;
  repositories: Repositories;
  /** 静的ファイル（Web 画面）を配信するディレクトリ。テストでは省略する。 */
  staticDir?: string;
}

export function createApp({ clock, repositories, staticDir }: AppDeps): Express {
  const productService = createProductService(repositories.products);
  const orderService = createOrderService({
    clock,
    products: repositories.products,
    orders: repositories.orders,
  });

  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '10kb' }));

  app.use(createHealthRouter());
  app.use('/api/products', createProductsRouter(productService));
  app.use('/api/orders', createOrdersRouter(orderService));
  app.use('/api', notFoundHandler);

  if (staticDir) {
    app.use(express.static(staticDir));
  }

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
