import type { Product } from '../domain/product.js';
import { AppError } from '../http/errors.js';
import type { ProductRepository } from '../repositories/productRepository.js';

export interface ProductService {
  listProducts(): Product[];
  getProduct(id: string): Product;
}

export function createProductService(products: ProductRepository): ProductService {
  return {
    listProducts: () => products.findAll(),
    getProduct(id) {
      const product = products.findById(id);
      if (!product) {
        throw new AppError(404, 'PRODUCT_NOT_FOUND', `Product not found: ${id}`, { productId: id });
      }
      return product;
    },
  };
}
