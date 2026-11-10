import { createOrderRepository, type OrderRepository } from './orderRepository.js';
import { createProductRepository, type ProductRepository } from './productRepository.js';

export interface Repositories {
  products: ProductRepository;
  orders: OrderRepository;
}

/** アプリ起動時に使うインメモリのリポジトリ一式（再起動するとデータは消える）。 */
export function createInMemoryRepositories(): Repositories {
  return {
    products: createProductRepository(),
    orders: createOrderRepository(),
  };
}
