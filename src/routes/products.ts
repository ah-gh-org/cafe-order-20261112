import { Router } from 'express';
import type { ProductService } from '../services/productService.js';

export function createProductsRouter(productService: ProductService): Router {
  const router = Router();

  router.get('/', (_req, res) => {
    res.json(productService.listProducts());
  });

  router.get('/:id', (req, res) => {
    res.json(productService.getProduct(req.params.id));
  });

  return router;
}
